# 🎬 MedPulse AI — Video Presentation Script & Walkthrough Guide
**Scenario:** Health Prediction Application using Patient Blood Test Results & External AI Health API  
**Evaluation:** Task 2 — Python Skills & Full-Stack Implementation  
**Submission Target:** `jobs@gokulinfocare.com`  
**Application URLs:** Frontend (`http://localhost:5174`), Backend (`http://localhost:8000`), Interactive Swagger Docs (`http://localhost:8000/docs`)

---

## 📌 Video Recording Quick Reference Checklist
- [ ] Ensure **backend** is running: `uvicorn main:app --reload` (Port 8000)
- [ ] Ensure **frontend** is running: `npm run dev` (Port 5174)
- [ ] Open the browser with MedPulse AI UI on screen
- [ ] Keep this script open on a second monitor or side window
- [ ] Target duration: **5 to 8 minutes**

---

## ⏱️ Video Timeline Overview
| Timestamp | Segment | Key Activities |
|---|---|---|
| **00:00 - 00:45** | **1. Introduction** | Greet interviewers, state objective, introduce the modern tech stack. |
| **00:45 - 03:30** | **2. Test Data & Error Handling** | Enter all 10 records from the test sheet; explain the 4 error cases. |
| **03:30 - 04:30** | **3. Required CRUD Demonstration** | Read records, Edit 1 email to `gokul@infocare.com`, Delete 1 record. |
| **04:30 - 06:30** | **4. Architecture & Code Walkthrough** | Explain what `api.ts`, `types.ts`, `validation.ts`, `main.py`, `schemas.py`, `models.py`, and AI integration do. |
| **06:30 - 07:15** | **5. Security & Conclusion** | Showcase environment variable safety, GitHub readiness, wrap up. |

---

## 🎙️ Spoken Presentation Script

### 🎬 Part 1: Introduction & System Overview (00:00 - 00:45)
> **[Camera on face or full screen showing the MedPulse AI interface]**

*"Hello everyone! My name is [Your Name], and this is my submission for **Task 2: Evaluation of Python Skills and Health Prediction Application** for Gokul Infocare.*

*For this project, I developed a full-stack, enterprise-grade clinical health prediction platform named **MedPulse AI**.*
- *On the **Backend**, I utilized **Python with FastAPI**, **SQLite**, and **SQLAlchemy ORM** for persistent storage, combined with **Pydantic V2** for multi-layered data validation, and integrated with **Google Gemini AI** for real-time biomarker risk prognosis.*
- *On the **Frontend**, I built a responsive, dark-mode medical interface using **React with TypeScript**, featuring real-time client validation, interactive biomarker range visualizers, custom calendar popovers, and an AI Diagnostic Center.*

*Let’s now proceed with the live demonstration using the exact 10 test entries from the specification sheet."*

---

### 🧪 Part 2: Demonstration of Test Data & Error Explanation (00:45 - 03:30)
> **[Action: Focus on the "Register Patient & AI Diagnostics" form]**

*"The specification gives us 10 test cases designed to test both normal operations and edge-case validation. Let's enter them one by one."*

#### ✅ Test Entry #1: Robyn Pears (Valid Entry)
- **Full Name:** `Robyn Pears`
- **Date of Birth:** `28/01/1960`
- **Email:** `robyn@gmail.com`
- **Glucose:** `232` | **Haemoglobin:** `13.5` | **Cholesterol:** `180`
> **[Action: Click 'Generate AI Risk Prediction'. Patient appears in the table with High Risk prediction.]**

*"Record 1 submits successfully. The blood glucose is 232 mg/dL, so the AI immediately identifies high diabetes risk, computes an overall health index of 55, and structures the clinical diagnosis in the remarks field."*

---

#### ❌ Test Entry #2: John Hunter (Error: Invalid Email Domain)
- **Full Name:** `John Hunter`
- **Date of Birth:** `10/12/1990`
- **Email:** `hunter@gmail` *(Note: No top-level domain `.com`)*
- **Glucose:** `94` | **Haemoglobin:** `15` | **Cholesterol:** `200`
> **[Action: Type `hunter@gmail`. Point out the validation error message under the field.]**

*"Now look at Test Record #2 for John Hunter. When we enter `hunter@gmail`, the application immediately flags an error: **'Email must be a valid format containing @ and a valid top-level domain'**.*
- **Why did it fail?** `hunter@gmail` is missing a domain extension like `.com` or `.org`.
- **How did we catch it?** We implemented a dual-layer RFC-compliant regex pattern in `validation.ts` on the frontend (`/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/`) and a Pydantic `@field_validator('email')` on the backend. It blocks incomplete emails from reaching the database."*

---

#### ✅ Test Entry #3: Darryl Tim (Valid Entry)
- **Full Name:** `Darryl Tim`
- **Date of Birth:** `12/11/1993`
- **Email:** `timd@smh.com.au`
- **Glucose:** `240` | **Haemoglobin:** `18.6` | **Cholesterol:** `326`
> **[Action: Submit record. AI returns High/Critical Risk due to Glucose 240 and Cholesterol 326.]**

*"Record 3 is valid. Notice the Australian domain `.com.au` is accepted correctly. With cholesterol at 326 and glucose at 240, the AI flags high cardiovascular and diabetes risk."*

---

#### ❌ Test Entry #4: Peter Larry (Error: Non-Existent Calendar Date)
- **Full Name:** `Peter Larry`
- **Date of Birth:** `31/11/2001` *(Note: November only has 30 days)*
- **Email:** `Larry@hotmail.com`
- **Glucose:** `88` | **Haemoglobin:** `11.5` | **Cholesterol:** `165`
> **[Action: Type `31/11/2001`. Point out the validation error.]**

*"In Test Record #4, Peter Larry's date of birth is given as `31/11/2001`.*
- **Why did it fail?** November is a 30-day month. November 31st does not exist on the Gregorian calendar.
- **How did we catch it?** Many naive regexes only check `\d{2}/\d{2}/\d{4}` and would falsely pass this. Our application parses the day, month, and year into an actual `datetime(year, month, day)` calendar object. When `31/11` is passed, the calendar engine catches the invalid date and raises: **'Date 31/11/2001 is not a real calendar date (November only has 30 days)'**."*

---

#### ✅ Test Entry #5: Sam Kerr (Valid Entry)
- **Full Name:** `Sam Kerr`
- **Date of Birth:** `09/12/2006`
- **Email:** `sam@news.com.au`
- **Glucose:** `198` | **Haemoglobin:** `8.9` | **Cholesterol:** `192`
> **[Action: Submit record. AI evaluates low haemoglobin (8.9) and high glucose (198).]**

*"Record 5 is successfully created. The AI remarks highlight both elevated blood glucose (198) and moderate-to-severe anemia from the 8.9 g/dL haemoglobin."*

---

#### ❌ Test Entry #6: Robyn Pears (Error: Duplicate Patient Record)
- **Full Name:** `Robyn Pears`
- **Date of Birth:** `28/01/1960`
- **Email:** `robyn@gmail.com`
- **Glucose:** `232` | **Haemoglobin:** `13.5` | **Cholesterol:** `180`
> **[Action: Submit this record. The system displays a red duplicate alert banner.]**

*"In Test Record #6, the exact same patient from Record #1 (Robyn Pears, `robyn@gmail.com`, DOB `28/01/1960`) is submitted again.*
- **Why did it fail?** It violates the uniqueness constraint for patient medical records.
- **How did we catch it?** In `backend/main.py`, the `POST /patients` endpoint executes an atomic SQLite query checking `WHERE email = :email AND date_of_birth = :dob`. When a duplicate is detected, it raises an HTTP 400 with: **'A patient record with this Email and Date of Birth already exists.'** preventing dirty database duplicates."*

---

#### ✅ Test Entry #7: Madison XI (Valid Entry)
- **Full Name:** `Madison XI`
- **Date of Birth:** `12/09/1998`
- **Email:** `madison@hotmail.com`
- **Glucose:** `85` | **Haemoglobin:** `7.6` | **Cholesterol:** `163`
> **[Action: Submit record. Health index optimal glucose/cholesterol, remarks identify severe anemia at 7.6 Hb.]**

*"Record 7 is created successfully with optimal metabolic markers and clear clinical advice on dietary iron for the 7.6 Hb level."*

---

#### ❌ Test Entry #8: Kris Wu (Error: Future Date & Missing '@' Symbol)
- **Full Name:** `Kris Wu`
- **Date of Birth:** `19/10/2030` *(Future Date)*
- **Email:** `Kris.wu.gmail.com` *(Missing '@' symbol)*
- **Glucose:** `79` | **Haemoglobin:** `16.5` | **Cholesterol:** `197`
> **[Action: Type `Kris.wu.gmail.com` and `19/10/2030`. Show both validation errors.]**

*"Test Record #8 has two distinct validation errors:*
1. *The email `Kris.wu.gmail.com` has no `@` symbol.*
2. *The birth date `19/10/2030` is in the future.*
- **How did we detect it?** Our date validator compares `parsed_date > datetime.now().date()`, immediately raising: **'Date of birth cannot be a future date'**, while the email validator rejects the missing `@` symbol."*

---

#### ✅ Test Entry #9: Tenille Singh (Valid Entry)
- **Full Name:** `Tenille Singh`
- **Date of Birth:** `30/11/1991`
- **Email:** `Tenille@yahoo.com`
- **Glucose:** `101` | **Haemoglobin:** `15` | **Cholesterol:** `310`
> **[Action: Submit record. System accurately accepts Nov 30 as a real date; AI flags high cholesterol at 310.]**

*"Record 9 succeeds. Notice that while November 31st was rejected in Record 4, November 30th is recognized as valid. The AI flags the 310 mg/dL cholesterol."*

---

#### ✅ Test Entry #10: Prem Kumar (Valid Entry)
- **Full Name:** `Prem Kumar`
- **Date of Birth:** `28/04/1990`
- **Email:** `prem@telstra.com`
- **Glucose:** `155` | **Haemoglobin:** `12.5` | **Cholesterol:** `265`
> **[Action: Submit record. Successfully added to registry.]**

*"Record 10 completes our dataset, registering smoothly with AI remarks for both elevated glucose and cholesterol."*

---

### 📋 Part 3: Required CRUD Operations Demonstration (03:30 - 04:30)
> **[Action: Scroll down to the Patient Diagnostic Directory table]**

*"Now let's demonstrate the 3 specific CRUD requirements from the assignment instructions:"*

#### 1. Read Operation
*"Here is the complete **Read** directory of all created patients. We can:
- **Search** in real-time by name, email, or DOB.
- **Filter** by risk category (*High / Critical*, *Moderate*, *Optimal*).
- **Filter by Date Section** (*Registered Today*, *Past 7 Days*, *Seniors 60+*).
- **Sort** dynamically by health score, glucose, or cholesterol.
- **Export to CSV** with one click.
- And clicking any row opens our full **AI Diagnostic Center modal** with detailed cardiovascular, metabolic, and hematologic risk charts."*

#### 2. Edit Operation (Requirement: Change email to `gokul@infocare.com`)
> **[Action: Click the Edit icon (pencil) on Robyn Pears or any record]**

*"Next, the instructions ask us to: **'Choose any ONE record and change their email to gokul@infocare.com'**.*
- *Let's click the Edit button for Robyn Pears.*
- *We change the email field to `gokul@infocare.com`.*
- *Click **'Save Changes'**.*
- *Notice the table instantly updates: the email is now `gokul@infocare.com`, and the database reflects this modification."*

#### 3. Delete Operation (Requirement: Delete 1 record & show updated list)
> **[Action: Click the Delete icon (trash) on any record, e.g. Madison XI]**

*"Finally, the instructions ask us to: **'Choose any ONE record and delete the record. Once deleted, show again the list of all records'**.*
- *Let's select Madison XI and click the Delete icon.*
- *A confirmation modal prevents accidental data loss.*
- *We confirm **'Delete Record'**.*
- *The record is deleted from SQLite, a toast confirmation appears, and our table now displays the updated list with the remaining records."*

---

### 💻 Part 4: Code & Architecture Walkthrough (04:30 - 06:30)
> **[Action: Switch to VS Code / IDE to show the project structure]**

*"Now let's review the code structure. I organized the application into clean, modular layers following industry best practices."*

#### 📂 Frontend Core Files (`frontend/src/`)
1. **`api.ts` (Typed REST API Client)**
   > *"Centralizes all asynchronous HTTP requests to the FastAPI backend using standard `fetch`. It handles parameter serialization, error extraction from FastAPI's JSON response, and returns strictly typed Promises (`getPatients`, `createPatient`, `updatePatient`, `deletePatient`, `reanalyzePatient`)."*

2. **`types.ts` (Data Contracts & Interfaces)**
   > *"Defines the TypeScript interfaces that align with our backend schemas. It types `Patient`, `PatientFormData`, `HealthStats`, and `StructuredRiskAnalysis`—ensuring compile-time type safety across all components."*

3. **`validation.ts` (Client-Side Validation Engine)**
   > *"Performs real-time validation on user inputs before hitting the network. It validates email RFC format, enforces `dd/mm/yyyy`, checks calendar validity (leap years and month day counts), checks for future dates, and enforces physiological bounds on biomarkers."*

4. **`App.tsx` (Root State Orchestrator)**
   > *"Coordinates the global application state. It manages the patient registry, handles API synchronization, triggers notifications via a custom toast notification system, and manages modal states for editing and inspection."*

5. **`PatientList.tsx` (Data Grid Component)**
   > *"Renders the responsive table with quick-action buttons, search, risk pills, and date section filters. Each row is interactive, allowing doctors to launch the Diagnostic Center modal without horizontal scrolling."*

6. **`AddPatientForm.tsx` & `DatePickerPopover.tsx`**
   > *"Features an interactive live biomarker meter calculating an estimated health score in real-time, quick fill presets, and a custom calendar popover with decade-jump navigation."*

---

#### 🐍 Backend Core Files (`backend/`)
1. **`main.py` (FastAPI Application & Endpoints)**
   > *"The entry point of the Python backend. It configures CORS middleware, establishes database dependency injection (`get_db`), and registers all REST endpoints (`GET`, `POST`, `PUT`, `DELETE`, `/stats`, `/reanalyze`), including duplicate record validation logic."*

2. **`models.py` (SQLAlchemy ORM Model)**
   > *"Defines the `Patient` database model mapping to our SQLite table. It stores `id`, `full_name`, `date_of_birth`, `email`, biomarker floats (`glucose`, `haemoglobin`, `cholesterol`), AI-generated `remarks`, and a `created_at` timestamp."*

3. **`schemas.py` (Pydantic V2 Request/Response Schemas)**
   > *"Enforces rigorous backend data validation. It contains `@field_validator` methods for full name cleanliness, email regex patterns, non-future calendar dates, and positive float ranges for blood measurements."*

4. **`gemini_service.py` (AI Risk Engine)**
   > *"Integrates with Google Gemini API to analyze patient blood biomarkers. It prompts Gemini with clinical threshold guidelines to generate a structured risk assessment, multi-organ evaluation, and health score, backed by a clinical heuristic fallback if offline."*

5. **`database.py` (Database Engine & Session Management)**
   > *"Configures the SQLite engine (`patients.db`) and SQLAlchemy `sessionmaker`. It exposes the `get_db` generator that automatically handles session lifecycle and rollback on errors."*

---

### 🛡️ Part 5: Security, GitHub Organization & Conclusion (06:30 - 07:15)
> **[Action: Show `.env.example` and the clean git status in terminal]**

*"Before uploading to GitHub, security best practices were strictly implemented:
- All sensitive credentials and API keys are stored in `.env` and kept strictly out of git via `.gitignore`.
- A `.env.example` file is provided with instructions for setup.
- The repository is organized into distinct `backend/` and `frontend/` directories with comprehensive `README.md` documentation and automated tests in `test_api.py`.

*In summary, this application fulfills all requirements of Task 2: complete CRUD functionality, real-time AI risk predictions, robust validation of all edge-case data, and a clean, responsive user experience.*

*Thank you for your time and consideration. I look forward to speaking with you in the interview stage!"*

---

## 💡 Quick Reference: Test Table Error Answers for Video
| Test # | Full Name | Entered Value | Error Reason to State on Video |
|---|---|---|---|
| **#2** | John Hunter | `hunter@gmail` | **Invalid Email:** Missing top-level domain (`.com`). Detected by RFC regex pattern in `validation.ts` & `schemas.py`. |
| **#4** | Peter Larry | `31.11.2001` | **Invalid Calendar Date:** November only has 30 days; Nov 31 is physically impossible. Detected by Python `datetime` calendar check. |
| **#6** | Robyn Pears | `robyn@gmail.com` + `28/01/1960` | **Duplicate Patient Record:** Record #1 already registered this email and DOB. Detected by database duplicate check in `main.py`. |
| **#8** | Kris Wu | `Kris.wu.gmail.com` & `19/10/2030` | **Future Date & Invalid Email:** Missing `@` in email and DOB is in the future. Detected by `parsed_date > today` and email regex. |
