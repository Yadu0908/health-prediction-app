# MedPulse AI — Advanced Clinical Health Risk Prediction Application

A medical intelligence platform built with **FastAPI**, **SQLite (SQLAlchemy ORM)**, **Google Gemini 3.5 Flash Lite / 3.8 Flash**, and **React (TypeScript + Vite)**. The system enables healthcare staff to register patients, evaluate laboratory biomarkers (Fasting Glucose, Haemoglobin, Total Cholesterol), and receive multi-system AI health risk prognoses.

---

## 📸 Key Features & Improvements

- **Upgraded Gemini Model**: Configured with **`gemini-3.5-flash-lite`** and **`gemini-3.8-flash`** for instant, structured JSON clinical risk predictions.
- **Deeply Structured Clinical Data**:
  - `risk_level`: Multi-system classification (**Critical**, **High**, **Moderate**, **Optimal**).
  - `health_score`: Dynamic 10–100 health index score.
  - Categorized Risk Evaluations:
    - **Metabolic / Type 2 Diabetes Risk**
    - **Cardiovascular & Atherogenic Risk**
    - **Hematologic / Anemia Status**
  - Actionable Care Plan with prioritized clinical recommendations and urgency follow-up protocols.
- **Live Interactive Biomarker Visualizer**:
  - Real-time gauge and dynamic range meters embedded directly in the patient registration form.
  - As you type numbers, range indicators move across Low, Normal, Borderline, and High thresholds, providing an instant health score preview.
  - Interactive preset chips (`Optimal`, `Borderline`, `Diabetic`, `Anemic`).
- **Interactive Patient Directory**:
  - **Quick Risk Filter Chips**: Filter the entire cohort by `All`, `High / Critical`, `Moderate`, or `Optimal`.
  - **Multi-criteria Sorting**: Sort by Newest, Health Score (lowest/highest risk), Full Name (A-Z), Fasting Glucose, or Cholesterol.
  - **CSV Export**: One-click download of all filtered records with biomarker data and AI prognoses.
  - **Clinical Diagnostic Center (Detail Modal)**: Multi-tab view with Diagnostic Meters, AI Risk Breakdown, and Actionable Care Plans, with printable report capabilities.
- **Strict Data Validation**:
  - RFC-compliant email verification.
  - Date of Birth validation (`dd/mm/yyyy`, rejects future dates and impossible calendar dates like 31 November).
  - Duplicate check on `email + date_of_birth` combination.
  - Positive numeric constraints.
- **Modern Dark Medical Theme**: Deep navy blue (`#0f172a`), cyan (`#06b6d4`), and emerald accents with glassmorphism, luminous borders, and micro-animations in pure Vanilla CSS.

---

## 📁 Project Structure

```
health-prediction-app/
├── backend/
│   ├── database.py           # SQLite connection & SQLAlchemy sessionmaker
│   ├── gemini_service.py     # Gemini 3.5 Flash Lite / 3.8 Flash client with JSON schema
│   ├── main.py               # REST API endpoints with structured response formatter
│   ├── models.py             # SQLAlchemy Patient ORM model
│   ├── schemas.py            # Pydantic schemas (HealthAnalysis, BiomarkerStatus, etc.)
│   ├── requirements.txt      # Python dependencies
│   ├── seed.py               # Database seeder with structured patient profiles
│   ├── test_api.py           # Automated test suite
│   ├── .env.example          # Environment variable template
│   └── .env                  # Environment file (configured with GEMINI_API_KEY)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddPatientForm.tsx      # Registration with Live Biomarker Range Meters
│   │   │   ├── DeleteConfirmModal.tsx  # Deletion confirmation
│   │   │   ├── EditPatientModal.tsx    # Modal to update patient records
│   │   │   ├── HealthStats.tsx         # Interactive cohort analytics cards
│   │   │   ├── Navbar.tsx              # Sticky header with Gemini 3.5 branding
│   │   │   ├── PatientDetailModal.tsx  # Multi-tab Diagnostic Center & Care Plan
│   │   │   ├── PatientList.tsx         # Search, risk filters, sorting, CSV export
│   │   │   ├── RemarksHighlightBox.tsx # Glowing card with structured multi-risk breakdown
│   │   │   └── Toast.tsx               # Notifications
│   │   ├── api.ts            # Typed HTTP client
│   │   ├── types.ts          # TypeScript interfaces (HealthAnalysis, Patient, Stats)
│   │   ├── validation.ts     # Client-side validation utilities
│   │   ├── App.css           # Vanilla CSS layout & animations
│   │   ├── App.tsx           # Main application state & interactions
│   │   ├── index.css         # Design system tokens & global styling
│   │   └── main.tsx          # Vite React entry point
│   ├── index.html            # HTML entry point with Google Fonts
│   ├── package.json          # Dependencies & scripts
│   └── vite.config.ts        # Vite configuration
└── README.md
```

---

## 🚀 Running the Application

### 1. Backend (FastAPI)
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Base URL: **http://localhost:8000**
- Interactive Swagger Documentation: **http://localhost:8000/docs**

### 2. Frontend (Vite + React)
```bash
cd frontend
npm run dev
```
- Web Application: **http://localhost:5174** (or **http://localhost:5173**)

---

## 🔬 Clinical Reference Ranges

| Biomarker | Reference Range | Clinical Interpretation |
| :--- | :--- | :--- |
| **Fasting Blood Glucose** | 70 – 99 mg/dL | 100–125 mg/dL: Prediabetes; &ge; 126 mg/dL: High Risk (Type 2 Diabetes) |
| **Haemoglobin (Hb)** | 12.0 – 17.5 g/dL | &lt; 12.0 g/dL: Low (Anemia Risk); &gt; 17.5 g/dL: Polycythemia / Dehydration |
| **Total Cholesterol** | &lt; 200 mg/dL | 200–239 mg/dL: Borderline; &ge; 240 mg/dL: High Risk (Cardiovascular / Atherosclerosis) |

---

## 🛡️ License
MIT License.
