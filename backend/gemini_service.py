import os
import json
import logging
from typing import Dict, Any, Optional, List
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

# Configured Gemini models in priority order
GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
]


def calculate_biomarker_status(glucose: float, haemoglobin: float, cholesterol: float) -> Dict[str, Any]:
    """Computes clinical statuses and reference evaluations for each biomarker."""
    # Glucose
    if glucose < 70:
        g_status = "Low"
        g_category = "Hypoglycemia Risk"
    elif glucose <= 99:
        g_status = "Optimal"
        g_category = "Normal Fasting"
    elif glucose <= 125:
        g_status = "Borderline"
        g_category = "Prediabetes Alert"
    else:
        g_status = "High"
        g_category = "Diabetes Alert"

    # Haemoglobin
    if haemoglobin < 12.0:
        h_status = "Low"
        h_category = "Anemia Alert"
    elif haemoglobin <= 17.5:
        h_status = "Optimal"
        h_category = "Normal Physiological"
    else:
        h_status = "High"
        h_category = "Elevated Alert"

    # Cholesterol
    if cholesterol < 200:
        c_status = "Optimal"
        c_category = "Desirable Level"
    elif cholesterol <= 239:
        c_status = "Borderline"
        c_category = "Borderline High"
    else:
        c_status = "High"
        c_category = "Cardiovascular Alert"

    return {
        "glucose": {
            "value": glucose,
            "unit": "mg/dL",
            "status": g_status,
            "category": g_category,
            "reference": "70 - 99 mg/dL",
        },
        "haemoglobin": {
            "value": haemoglobin,
            "unit": "g/dL",
            "status": h_status,
            "category": h_category,
            "reference": "12.0 - 17.5 g/dL",
        },
        "cholesterol": {
            "value": cholesterol,
            "unit": "mg/dL",
            "status": c_status,
            "category": c_category,
            "reference": "< 200 mg/dL",
        },
    }


def generate_structured_clinical_baseline(
    glucose: float, haemoglobin: float, cholesterol: float, patient_name: Optional[str] = None
) -> Dict[str, Any]:
    """Generates structured clinical baseline risk assessment if Gemini API is unreachable."""
    recs: List[str] = []
    risk_score = 100

    # Glucose evaluation
    if glucose < 70:
        g_level = "Moderate"
        g_text = f"Hypoglycemia risk detected with low fasting glucose ({glucose} mg/dL). Investigate dietary routine and endocrine causes."
        recs.append("Monitor blood sugar regularly and consume complex carbohydrates.")
        risk_score -= 20
    elif glucose <= 99:
        g_level = "Low"
        g_text = f"Fasting glucose is optimal at {glucose} mg/dL (normal reference: 70-99 mg/dL)."
    elif glucose <= 125:
        g_level = "Moderate"
        g_text = f"Prediabetes alert: Fasting glucose is elevated at {glucose} mg/dL. Indicates impaired fasting glycaemia."
        recs.append("Schedule a confirmatory HbA1c test to evaluate 3-month glycemic control.")
        recs.append("Adopt low-glycemic dietary adjustments and regular aerobic activity.")
        risk_score -= 25
    else:
        g_level = "High"
        g_text = f"High risk of Type 2 Diabetes: Significantly elevated fasting glucose ({glucose} mg/dL)."
        recs.append("Urgent endocrine / primary physician consultation for diabetes confirmation and HbA1c.")
        recs.append("Initiate diabetic dietary management and frequent blood sugar monitoring.")
        risk_score -= 40

    # Haemoglobin evaluation
    if haemoglobin < 12.0:
        h_level = "High" if haemoglobin < 10.0 else "Moderate"
        h_text = f"Low haemoglobin ({haemoglobin} g/dL) points to microcytic or nutritional anemia."
        recs.append("Complete blood count (CBC) with serum ferritin and iron profile testing advised.")
        recs.append("Incorporate iron-rich nutrition or iron supplementation under medical supervision.")
        risk_score -= 25
    elif haemoglobin <= 17.5:
        h_level = "Low"
        h_text = f"Haemoglobin is optimal at {haemoglobin} g/dL (normal reference: 12.0-17.5 g/dL)."
    else:
        h_level = "Moderate"
        h_text = f"Haemoglobin is elevated ({haemoglobin} g/dL); hydration check or polycythemia evaluation recommended."
        recs.append("Maintain adequate hydration and review blood volume markers.")
        risk_score -= 15

    # Cholesterol evaluation
    if cholesterol < 200:
        c_level = "Low"
        c_text = f"Total cholesterol is optimal at {cholesterol} mg/dL (desirable: <200 mg/dL)."
    elif cholesterol <= 239:
        c_level = "Moderate"
        c_text = f"Cholesterol is borderline elevated ({cholesterol} mg/dL), representing moderate cardiovascular risk."
        recs.append("Schedule a full lipid panel (LDL, HDL, Triglycerides).")
        recs.append("Reduce dietary saturated fats and increase soluble fiber intake.")
        risk_score -= 20
    else:
        c_level = "High"
        c_text = f"High cardiovascular and atherogenic risk due to elevated total cholesterol ({cholesterol} mg/dL)."
        recs.append("Cardiologist or primary physician consultation for lipid management therapy.")
        recs.append("Comprehensive cardiovascular risk assessment including lipid profile and ECG.")
        risk_score -= 35

    # Overall Risk Level
    risk_score = max(10, min(100, risk_score))
    if risk_score >= 85:
        overall_risk = "Optimal"
        urgency = "Routine Annual Health Checkup"
    elif risk_score >= 65:
        overall_risk = "Moderate"
        urgency = "Follow-up Recommended within 30-60 Days"
    elif risk_score >= 40:
        overall_risk = "High"
        urgency = "Clinical Consultation Recommended"
    else:
        overall_risk = "Critical"
        urgency = "Immediate Physician Attention Advised"

    # Summary sentence
    summary_parts = []
    if g_level == "High":
        summary_parts.append("High risk of Type 2 Diabetes due to elevated glucose")
    elif g_level == "Moderate":
        summary_parts.append("Borderline prediabetic glucose level")

    if c_level == "High":
        summary_parts.append("elevated cardiovascular risk from high total cholesterol")
    elif c_level == "Moderate":
        summary_parts.append("borderline cholesterol")

    if h_level in ("High", "Moderate"):
        summary_parts.append("low haemoglobin indicating possible anemia")

    if not summary_parts:
        summary_text = "All blood biomarker parameters (glucose, haemoglobin, cholesterol) fall within healthy standard physiological limits."
    else:
        summary_text = "Elevated indicators detected: " + ", ".join(summary_parts) + ". Follow-up testing advised."

    return {
        "risk_level": overall_risk,
        "health_score": risk_score,
        "summary": summary_text,
        "diabetes_risk": {
            "level": g_level,
            "assessment": g_text,
        },
        "cardiovascular_risk": {
            "level": c_level,
            "assessment": c_text,
        },
        "anemia_risk": {
            "level": h_level,
            "assessment": h_text,
        },
        "recommendations": recs if recs else ["Maintain healthy lifestyle, balanced nutrition, and annual routine screening."],
        "urgency": urgency,
        "model_used": "Clinical Expert Baseline",
    }


async def generate_health_remarks(
    full_name: str,
    date_of_birth: str,
    glucose: float,
    haemoglobin: float,
    cholesterol: float,
) -> Dict[str, Any]:
    """
    Calls Google Gemini API (gemini-3.8-flash or gemini-3.5-flash-lite)
    with strict JSON output schema to produce structured clinical risk predictions.
    Falls back gracefully to clinical rule logic if necessary.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key or api_key == "your_gemini_api_key_here":
        logger.info("GEMINI_API_KEY is missing. Using structured clinical baseline.")
        return generate_structured_clinical_baseline(glucose, haemoglobin, cholesterol, full_name)

    prompt = f"""You are a professional medical AI assistant providing structured clinical health risk predictions.
Analyze this patient's blood laboratory biomarkers:
- Patient Name: {full_name}
- Date of Birth: {date_of_birth}
- Fasting Glucose: {glucose} mg/dL (Reference: 70-99 mg/dL normal, 100-125 prediabetes, >=126 diabetes)
- Haemoglobin: {haemoglobin} g/dL (Reference: 12.0-17.5 g/dL normal, <12.0 low/anemia, >17.5 high)
- Total Cholesterol: {cholesterol} mg/dL (Reference: <200 desirable, 200-239 borderline, >=240 high risk)

Return a strictly valid JSON object matching this schema:
{{
  "risk_level": "Optimal" | "Moderate" | "High" | "Critical",
  "health_score": integer between 10 and 100,
  "summary": "2-sentence concise clinical summary of the patient's primary health status and risks",
  "diabetes_risk": {{
    "level": "Low" | "Moderate" | "High",
    "assessment": "Detailed evaluation of glucose level and diabetes risk"
  }},
  "cardiovascular_risk": {{
    "level": "Low" | "Moderate" | "High",
    "assessment": "Detailed evaluation of cholesterol and heart/arterial health risk"
  }},
  "anemia_risk": {{
    "level": "Low" | "Moderate" | "High",
    "assessment": "Detailed evaluation of haemoglobin level and red blood cell status"
  }},
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],
  "urgency": "Routine" | "Follow-up Recommended" | "Clinical Consultation Advised" | "Immediate Physician Attention"
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": 600,
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        for model in GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            raw_text = parts[0]["text"].strip()
                            try:
                                structured = json.loads(raw_text)
                                structured["model_used"] = model
                                logger.info(f"Successfully generated structured analysis with {model}")
                                return structured
                            except json.JSONDecodeError as jde:
                                logger.warning(f"Model {model} returned non-JSON text: {raw_text[:100]} ({jde})")
                else:
                    logger.warning(f"Gemini API model {model} returned {response.status_code}: {response.text[:120]}")

            except Exception as e:
                logger.error(f"Error querying Gemini model {model}: {e}")

    # Fallback if all models fail
    logger.info("Falling back to structured clinical baseline.")
    return generate_structured_clinical_baseline(glucose, haemoglobin, cholesterol, full_name)
