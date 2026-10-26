import re
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
DOB_REGEX = re.compile(r"^\d{2}/\d{2}/\d{4}$")


class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120, description="Full name of the patient")
    date_of_birth: str = Field(..., description="Date of birth in dd/mm/yyyy format")
    email: str = Field(..., description="Valid email address")
    glucose: float = Field(..., gt=0, le=1000, description="Fasting Blood Glucose level in mg/dL")
    haemoglobin: float = Field(..., gt=0, le=35, description="Haemoglobin level in g/dL")
    cholesterol: float = Field(..., gt=0, le=1000, description="Total Cholesterol level in mg/dL")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        if not re.search(r"[a-zA-Z]", cleaned):
            raise ValueError("Full name must contain letters.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email format. Must contain '@' and a proper domain (e.g., patient@example.com).")
        domain = cleaned.split("@")[1]
        if "." not in domain or domain.startswith(".") or domain.endswith("."):
            raise ValueError("Email must include a valid domain name.")
        return cleaned

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: str) -> str:
        cleaned = v.strip()
        if not DOB_REGEX.match(cleaned):
            raise ValueError("Date of birth must be in dd/mm/yyyy format (e.g. 15/08/1990).")

        day_str, month_str, year_str = cleaned.split("/")
        day, month, year = int(day_str), int(month_str), int(year_str)

        if year < 1900:
            raise ValueError("Date of birth year cannot be earlier than 1900.")

        try:
            parsed_date = datetime(year, month, day).date()
        except ValueError as err:
            raise ValueError(f"Invalid calendar date ({cleaned}): {err}. Please enter a real date.") from err

        today = datetime.now().date()
        if parsed_date > today:
            raise ValueError(f"Date of birth cannot be a future date (entered {cleaned}).")

        return cleaned

    @field_validator("glucose", "haemoglobin", "cholesterol")
    @classmethod
    def validate_numeric_positive(cls, v: float, info) -> float:
        if v <= 0:
            raise ValueError(f"{info.field_name.capitalize()} must be a positive numeric value.")
        return round(float(v), 2)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=120)
    date_of_birth: Optional[str] = None
    email: Optional[str] = None
    glucose: Optional[float] = Field(None, gt=0, le=1000)
    haemoglobin: Optional[float] = Field(None, gt=0, le=35)
    cholesterol: Optional[float] = Field(None, gt=0, le=1000)
    remarks: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        if not re.search(r"[a-zA-Z]", cleaned):
            raise ValueError("Full name must contain letters.")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email format. Must contain '@' and a proper domain.")
        domain = cleaned.split("@")[1]
        if "." not in domain or domain.startswith(".") or domain.endswith("."):
            raise ValueError("Email must include a valid domain name.")
        return cleaned

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip()
        if not DOB_REGEX.match(cleaned):
            raise ValueError("Date of birth must be in dd/mm/yyyy format.")

        day_str, month_str, year_str = cleaned.split("/")
        day, month, year = int(day_str), int(month_str), int(year_str)

        if year < 1900:
            raise ValueError("Date of birth year cannot be earlier than 1900.")

        try:
            parsed_date = datetime(year, month, day).date()
        except ValueError as err:
            raise ValueError(f"Invalid calendar date: {err}.") from err

        today = datetime.now().date()
        if parsed_date > today:
            raise ValueError("Date of birth cannot be a future date.")

        return cleaned


# Structured Clinical Analysis Schemas
class RiskDetail(BaseModel):
    level: str
    assessment: str


class HealthAnalysis(BaseModel):
    risk_level: str
    health_score: int
    summary: str
    diabetes_risk: RiskDetail
    cardiovascular_risk: RiskDetail
    anemia_risk: RiskDetail
    recommendations: List[str]
    urgency: str
    model_used: Optional[str] = "Gemini 3.5 Flash Lite"


class BiomarkerMetric(BaseModel):
    value: float
    unit: str
    status: str
    category: str
    reference: str


class BiomarkerStatusSummary(BaseModel):
    glucose: BiomarkerMetric
    haemoglobin: BiomarkerMetric
    cholesterol: BiomarkerMetric


class PatientResponse(PatientBase):
    id: int
    remarks: Optional[str] = None
    created_at: datetime
    age: Optional[int] = None
    risk_level: str = "Moderate"
    health_score: int = 75
    analysis: Optional[HealthAnalysis] = None
    biomarker_status: Optional[BiomarkerStatusSummary] = None

    class Config:
        from_attributes = True


class HealthStatsResponse(BaseModel):
    total_patients: int
    avg_glucose: float
    avg_haemoglobin: float
    avg_cholesterol: float
    high_risk_count: int
    moderate_risk_count: int = 0
    optimal_count: int = 0
    avg_health_score: float = 75.0
