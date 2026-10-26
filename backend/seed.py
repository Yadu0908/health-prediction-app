import json
from database import SessionLocal, Base, engine
from models import Patient
from gemini_service import generate_structured_clinical_baseline

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing and re-seed with structured records
    db.query(Patient).delete()

    patients_meta = [
        {
            "full_name": "Alexander Wright",
            "date_of_birth": "12/04/1979",
            "email": "alexander.wright@medicare.org",
            "glucose": 142.0,
            "haemoglobin": 14.8,
            "cholesterol": 248.0,
        },
        {
            "full_name": "Sophia Martinez",
            "date_of_birth": "28/09/1994",
            "email": "sophia.martinez@healthlab.com",
            "glucose": 86.0,
            "haemoglobin": 10.5,
            "cholesterol": 178.0,
        },
        {
            "full_name": "David Chen",
            "date_of_birth": "17/11/1986",
            "email": "david.chen@bioanalytics.io",
            "glucose": 92.0,
            "haemoglobin": 15.2,
            "cholesterol": 182.0,
        },
        {
            "full_name": "Beatrice Dupont",
            "date_of_birth": "03/07/1968",
            "email": "beatrice.dupont@clinique.fr",
            "glucose": 118.0,
            "haemoglobin": 13.6,
            "cholesterol": 224.0,
        },
        {
            "full_name": "Marcus Vance",
            "date_of_birth": "22/10/1981",
            "email": "marcus.vance@healthlink.net",
            "glucose": 168.0,
            "haemoglobin": 13.5,
            "cholesterol": 255.0,
        },
    ]

    for p_data in patients_meta:
        analysis = generate_structured_clinical_baseline(
            p_data["glucose"], p_data["haemoglobin"], p_data["cholesterol"], p_data["full_name"]
        )
        patient = Patient(
            full_name=p_data["full_name"],
            date_of_birth=p_data["date_of_birth"],
            email=p_data["email"],
            glucose=p_data["glucose"],
            haemoglobin=p_data["haemoglobin"],
            cholesterol=p_data["cholesterol"],
            remarks=json.dumps(analysis),
        )
        db.add(patient)

    db.commit()
    print(f"Successfully seeded {len(patients_meta)} structured patient records.")
    db.close()

if __name__ == "__main__":
    seed_data()
