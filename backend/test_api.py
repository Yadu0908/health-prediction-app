import sys
from fastapi.testclient import TestClient
from main import app
from database import Base, engine

client = TestClient(app)

def run_tests():
    print("=== RUNNING BACKEND TESTS ===")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Test Health endpoint
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ Health check passed")

    # 2. Test Invalid Email
    res = client.post("/patients", json={
        "full_name": "John Doe",
        "date_of_birth": "15/05/1990",
        "email": "invalid-email-without-at",
        "glucose": 95.0,
        "haemoglobin": 14.5,
        "cholesterol": 180.0
    })
    assert res.status_code == 422, f"Expected 422 for bad email, got {res.status_code}: {res.text}"
    print("✓ Email validation passed (rejected invalid email)")

    # 3. Test Invalid Calendar Date (31 November has only 30 days)
    res = client.post("/patients", json={
        "full_name": "John Doe",
        "date_of_birth": "31/11/1990",
        "email": "john.doe@example.com",
        "glucose": 95.0,
        "haemoglobin": 14.5,
        "cholesterol": 180.0
    })
    assert res.status_code == 422, f"Expected 422 for Nov 31st, got {res.status_code}: {res.text}"
    print("✓ Real calendar date validation passed (rejected 31 November)")

    # 4. Test Future Date
    res = client.post("/patients", json={
        "full_name": "Future Baby",
        "date_of_birth": "15/12/2099",
        "email": "future@example.com",
        "glucose": 95.0,
        "haemoglobin": 14.5,
        "cholesterol": 180.0
    })
    assert res.status_code == 422, f"Expected 422 for future date, got {res.status_code}: {res.text}"
    print("✓ Future date validation passed (rejected future date)")

    # 5. Test Non-numeric or negative values
    res = client.post("/patients", json={
        "full_name": "Test Person",
        "date_of_birth": "15/05/1990",
        "email": "test@example.com",
        "glucose": -10.0,
        "haemoglobin": 14.5,
        "cholesterol": 180.0
    })
    assert res.status_code == 422, f"Expected 422 for negative glucose, got {res.status_code}: {res.text}"
    print("✓ Numeric positive validation passed")

    # 6. Test Valid Patient Creation & AI Remarks
    res = client.post("/patients", json={
        "full_name": "Sarah Connor",
        "date_of_birth": "10/05/1985",
        "email": "sarah.connor@cyberdyne.org",
        "glucose": 145.0,
        "haemoglobin": 11.2,
        "cholesterol": 245.0
    })
    assert res.status_code == 201, f"Creation failed: {res.text}"
    data = res.json()
    assert data["id"] is not None
    assert len(data["remarks"]) > 0
    print(f"✓ Valid patient creation passed with remarks: '{data['remarks'][:60]}...'")
    patient_id = data["id"]

    # 7. Test Duplicate Check (same email + dob)
    res_dup = client.post("/patients", json={
        "full_name": "Sarah Connor Duplicate",
        "date_of_birth": "10/05/1985",
        "email": "sarah.connor@cyberdyne.org",
        "glucose": 90.0,
        "haemoglobin": 13.0,
        "cholesterol": 170.0
    })
    assert res_dup.status_code == 400, f"Expected 400 for duplicate email+dob, got {res_dup.status_code}: {res_dup.text}"
    print("✓ Duplicate email + date_of_birth check passed")

    # 8. Test GET /patients
    res = client.get("/patients")
    assert res.status_code == 200
    assert len(res.json()) >= 1
    print("✓ GET /patients passed")

    # 9. Test GET /patients/{id}
    res = client.get(f"/patients/{patient_id}")
    assert res.status_code == 200
    assert res.json()["full_name"] == "Sarah Connor"
    print("✓ GET /patients/{id} passed")

    # 10. Test PUT /patients/{id}
    res = client.put(f"/patients/{patient_id}", json={
        "glucose": 98.0,
        "haemoglobin": 13.5,
        "cholesterol": 175.0
    })
    assert res.status_code == 200
    updated = res.json()
    assert updated["glucose"] == 98.0
    print("✓ PUT /patients/{id} passed with updated values")

    # 11. Test DELETE /patients/{id}
    res = client.delete(f"/patients/{patient_id}")
    assert res.status_code == 200
    print("✓ DELETE /patients/{id} passed")

    # Verify not found after delete
    res = client.get(f"/patients/{patient_id}")
    assert res.status_code == 404
    print("✓ Verified deletion with 404 response")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    run_tests()
