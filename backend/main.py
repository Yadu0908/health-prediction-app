import os
import json
import logging
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from database import engine, Base, get_db
from models import Patient
from schemas import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    HealthStatsResponse,
)
from gemini_service import (
    generate_health_remarks,
    generate_structured_clinical_baseline,
    calculate_biomarker_status,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("health-prediction-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")
    yield


app = FastAPI(
    title="Health Prediction API",
    description="Backend service for patient management and AI health risk predictions using Gemini 3.5 Flash Lite / 3.8 Flash.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_patient_response(patient: Patient) -> dict:
    """Transforms Patient database record into a rich structured response."""
    # Compute age
    age = None
    try:
        parts = patient.date_of_birth.split("/")
        year = int(parts[2])
        today_year = datetime.now().year
        age = today_year - year
    except Exception:
        pass

    # Biomarker status breakdown
    biomarkers = calculate_biomarker_status(
        patient.glucose, patient.haemoglobin, patient.cholesterol
    )

    # Structured analysis parsing
    analysis = None
    summary_text = ""
    risk_level = "Moderate"
    health_score = 75

    if patient.remarks:
        try:
            parsed = json.loads(patient.remarks)
            if isinstance(parsed, dict) and "risk_level" in parsed:
                analysis = parsed
                risk_level = parsed.get("risk_level", "Moderate")
                health_score = int(parsed.get("health_score", 75))
                summary_text = parsed.get("summary", "")
        except Exception:
            # Legacy raw text remarks
            pass

    if not analysis:
        analysis = generate_structured_clinical_baseline(
            patient.glucose, patient.haemoglobin, patient.cholesterol, patient.full_name
        )
        risk_level = analysis["risk_level"]
        health_score = int(analysis["health_score"])
        summary_text = analysis["summary"]

    if not summary_text:
        summary_text = patient.remarks or analysis.get("summary", "Health assessment recorded.")

    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "email": patient.email,
        "glucose": patient.glucose,
        "haemoglobin": patient.haemoglobin,
        "cholesterol": patient.cholesterol,
        "remarks": summary_text,
        "created_at": patient.created_at,
        "age": age,
        "risk_level": risk_level,
        "health_score": health_score,
        "analysis": analysis,
        "biomarker_status": biomarkers,
    }


@app.get("/", include_in_schema=False)
def root():
    """Redirect root traffic to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {"status": "ok", "service": "health-prediction-api", "version": "2.0.0"}


@app.get("/stats", response_model=HealthStatsResponse, tags=["Analytics"])
def get_health_stats(db: Session = Depends(get_db)):
    """Provides high-level diagnostic analytics across all registered patients."""
    patients = db.query(Patient).all()
    total = len(patients)
    if total == 0:
        return HealthStatsResponse(
            total_patients=0,
            avg_glucose=0.0,
            avg_haemoglobin=0.0,
            avg_cholesterol=0.0,
            high_risk_count=0,
            moderate_risk_count=0,
            optimal_count=0,
            avg_health_score=0.0,
        )

    avg_glucose = db.query(func.avg(Patient.glucose)).scalar() or 0.0
    avg_haemoglobin = db.query(func.avg(Patient.haemoglobin)).scalar() or 0.0
    avg_cholesterol = db.query(func.avg(Patient.cholesterol)).scalar() or 0.0

    high_risk_count = 0
    moderate_risk_count = 0
    optimal_count = 0
    total_score = 0

    for p in patients:
        formatted = format_patient_response(p)
        lvl = formatted["risk_level"]
        total_score += formatted["health_score"]
        if lvl in ("High", "Critical"):
            high_risk_count += 1
        elif lvl == "Moderate":
            moderate_risk_count += 1
        else:
            optimal_count += 1

    return HealthStatsResponse(
        total_patients=total,
        avg_glucose=round(float(avg_glucose), 1),
        avg_haemoglobin=round(float(avg_haemoglobin), 1),
        avg_cholesterol=round(float(avg_cholesterol), 1),
        high_risk_count=high_risk_count,
        moderate_risk_count=moderate_risk_count,
        optimal_count=optimal_count,
        avg_health_score=round(total_score / total, 1),
    )


@app.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED, tags=["Patients"])
async def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    """
    Create a new patient record with lab measurements.
    Validates data, checks for duplicate email + date of birth,
    and calls Google Gemini to generate structured health risk prediction remarks.
    """
    existing_patient = db.query(Patient).filter(
        Patient.email == payload.email,
        Patient.date_of_birth == payload.date_of_birth,
    ).first()

    if existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A patient record with email '{payload.email}' and date of birth '{payload.date_of_birth}' already exists.",
        )

    # Call Gemini API for structured health risk prediction remarks
    try:
        structured_analysis = await generate_health_remarks(
            full_name=payload.full_name,
            date_of_birth=payload.date_of_birth,
            glucose=payload.glucose,
            haemoglobin=payload.haemoglobin,
            cholesterol=payload.cholesterol,
        )
        remarks_json = json.dumps(structured_analysis)
    except Exception as e:
        logger.error(f"Error during AI remarks generation: {e}")
        fallback = generate_structured_clinical_baseline(
            payload.glucose, payload.haemoglobin, payload.cholesterol, payload.full_name
        )
        remarks_json = json.dumps(fallback)

    new_patient = Patient(
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        email=payload.email,
        glucose=payload.glucose,
        haemoglobin=payload.haemoglobin,
        cholesterol=payload.cholesterol,
        remarks=remarks_json,
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return format_patient_response(new_patient)


@app.get("/patients", response_model=List[PatientResponse], tags=["Patients"])
def get_patients(
    search: Optional[str] = Query(None, description="Search by name, email, or date of birth"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (Optimal, Moderate, High, Critical)"),
    db: Session = Depends(get_db),
):
    """Retrieve all patient records, with optional search and risk level filter."""
    query = db.query(Patient)
    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Patient.full_name).like(search_term),
                func.lower(Patient.email).like(search_term),
                Patient.date_of_birth.like(search_term),
            )
        )
    patients = query.order_by(Patient.created_at.desc()).all()
    formatted_list = [format_patient_response(p) for p in patients]

    if risk_level and risk_level.strip().lower() != "all":
        target = risk_level.strip().lower()
        formatted_list = [p for p in formatted_list if p["risk_level"].lower() == target]

    return formatted_list


@app.get("/patients/{patient_id}", response_model=PatientResponse, tags=["Patients"])
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Retrieve a single patient record by ID."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found.",
        )
    return format_patient_response(patient)


@app.put("/patients/{patient_id}", response_model=PatientResponse, tags=["Patients"])
async def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
):
    """
    Update patient information.
    Checks for uniqueness conflicts and re-evaluates structured AI remarks if blood metrics are changed.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found.",
        )

    new_email = payload.email if payload.email is not None else patient.email
    new_dob = payload.date_of_birth if payload.date_of_birth is not None else patient.date_of_birth

    conflict = db.query(Patient).filter(
        Patient.email == new_email,
        Patient.date_of_birth == new_dob,
        Patient.id != patient_id,
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another patient record with email '{new_email}' and date of birth '{new_dob}' already exists.",
        )

    blood_values_changed = (
        (payload.glucose is not None and payload.glucose != patient.glucose)
        or (payload.haemoglobin is not None and payload.haemoglobin != patient.haemoglobin)
        or (payload.cholesterol is not None and payload.cholesterol != patient.cholesterol)
    )

    if payload.full_name is not None:
        patient.full_name = payload.full_name
    if payload.email is not None:
        patient.email = payload.email
    if payload.date_of_birth is not None:
        patient.date_of_birth = payload.date_of_birth
    if payload.glucose is not None:
        patient.glucose = payload.glucose
    if payload.haemoglobin is not None:
        patient.haemoglobin = payload.haemoglobin
    if payload.cholesterol is not None:
        patient.cholesterol = payload.cholesterol

    if payload.remarks is not None:
        patient.remarks = payload.remarks
    elif blood_values_changed:
        try:
            structured = await generate_health_remarks(
                full_name=patient.full_name,
                date_of_birth=patient.date_of_birth,
                glucose=patient.glucose,
                haemoglobin=patient.haemoglobin,
                cholesterol=patient.cholesterol,
            )
            patient.remarks = json.dumps(structured)
        except Exception as e:
            logger.error(f"Error regenerating remarks on update: {e}")

    db.commit()
    db.refresh(patient)
    return format_patient_response(patient)


@app.delete("/patients/{patient_id}", tags=["Patients"])
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete a patient record by ID."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found.",
        )

    db.delete(patient)
    db.commit()
    return {"message": f"Patient '{patient.full_name}' (ID: {patient_id}) successfully deleted.", "success": True}


@app.post("/patients/{patient_id}/analyze", response_model=PatientResponse, tags=["Patients"])
async def reanalyze_patient(patient_id: int, db: Session = Depends(get_db)):
    """Re-run AI health risk analysis on demand using Gemini."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found.",
        )

    structured = await generate_health_remarks(
        full_name=patient.full_name,
        date_of_birth=patient.date_of_birth,
        glucose=patient.glucose,
        haemoglobin=patient.haemoglobin,
        cholesterol=patient.cholesterol,
    )
    patient.remarks = json.dumps(structured)

    db.commit()
    db.refresh(patient)
    return format_patient_response(patient)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
