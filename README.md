# 🏦 LoanLens — Loan Eligibility Prediction Platform

A complete backend + ML system for predicting loan eligibility across three user types: **Individual**, **Student**, and **Organisation**.

---

## 📁 Project Structure

```
final-loanlens/
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   └── constants.js          # App-wide constants
│   │   ├── controllers/
│   │   │   ├── userController.js     # User CRUD
│   │   │   └── applicationController.js # Loan application + prediction
│   │   ├── middleware/
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   └── validators.js         # Request validation
│   │   ├── models/
│   │   │   ├── User.js               # User schema
│   │   │   └── Application.js        # Application schema
│   │   ├── routes/
│   │   │   ├── userRoutes.js
│   │   │   └── applicationRoutes.js
│   │   ├── scripts/
│   │   │   └── seed.js               # Database seeder
│   │   ├── utils/
│   │   │   ├── emiCalculator.js      # EMI formula
│   │   │   └── simulatedData.js      # UPI/subscription/social generator
│   │   └── server.js                 # Express entry point
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── ml-service/                       # Python FastAPI ML service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app + routes
│   │   ├── model.py                  # ML training + prediction
│   │   ├── schemas.py                # Pydantic models
│   │   ├── config.py                 # Feature lists + constants
│   │   └── emi.py                    # EMI calculator (Python)
│   ├── requirements.txt
│   └── .gitignore
│
└── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9
- **MongoDB** running locally on port 27017 (or update `.env`)

---

### 1. Start MongoDB

Make sure MongoDB is running:

```bash
# If using mongod directly:
mongod

# If using MongoDB as a service, it should already be running
```

---

### 2. Start the ML Service (Python)

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The ML service will:
- Train 3 Random Forest models (individual, student, organisation) on startup
- Be available at `http://localhost:8000`
- Show training accuracy in the console

---

### 3. Start the Backend (Node.js)

```bash
cd backend

# Install dependencies
npm install

# (Optional) Seed sample users
npm run seed

# Start dev server
npm run dev
```

Backend will be available at `http://localhost:5000`

---

## 📡 API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a user |
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/apply` | Submit a loan application |
| GET | `/api/applications` | List all applications |
| GET | `/api/application/:id` | Get application by ID |
| POST | `/api/predict` | Trigger ML prediction |

---

## 🧪 Testing with cURL

### 1. Create a User

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "role": "individual"
  }'
```

### 2. Submit an Individual Loan Application

```bash
curl -X POST http://localhost:5000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_ID_FROM_STEP_1>",
    "type": "individual",
    "loan_type": "home",
    "loan_amount": 3000000,
    "tenure": 240,
    "individual_inputs": {
      "income": 120000,
      "current_assets": 1500000,
      "cibil_score": 780,
      "age": 32,
      "employment_status": "salaried"
    }
  }'
```

### 3. Submit a Student Loan Application

```bash
curl -X POST http://localhost:5000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_ID>",
    "type": "student",
    "loan_type": "educational",
    "loan_amount": 1500000,
    "tenure": 60,
    "student_inputs": {
      "guardian_income": 85000,
      "guardian_cibil": 720,
      "student_age": 21,
      "guardian_existing_loans": 200000,
      "guardian_assets": 3000000,
      "student_income": 0,
      "linkedin_profile": "https://linkedin.com/in/student",
      "github_profile": "https://github.com/student"
    }
  }'
```

### 4. Submit an Organisation Loan Application

```bash
curl -X POST http://localhost:5000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_ID>",
    "type": "organisation",
    "loan_type": "professional",
    "loan_amount": 25000000,
    "tenure": 120,
    "organisation_inputs": {
      "balance_sheet_summary": 50000000,
      "debt_to_equity_ratio": 0.8,
      "current_ratio": 2.1,
      "revenue": 80000000,
      "GST_turnover": 65000000,
      "number_of_employees": 150
    }
  }'
```

### 5. Run Prediction

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "<APPLICATION_ID>"
  }'
```

### 6. Get All Applications

```bash
curl http://localhost:5000/api/applications
```

---

## 🤖 ML Service Details

### Models
- **Algorithm**: Random Forest Classifier (150 trees, max_depth=12)
- **Training Data**: Synthetically generated at startup (3000 individual, 2000 student, 2000 organisation samples)
- **Features**: Engineered from user inputs + simulated behavioral data

### Simulated Data (Auto-Generated)
For individual and student applicants, the backend automatically generates:
1. **UPI Transactions** (20 recent): amount, type (credit/debit), category
2. **Entertainment Subscriptions**: Netflix, Spotify, etc. with monthly costs
3. **Social Media Usage**: Instagram hours/day

### Prediction Output
```json
{
  "approval": 1,
  "probability_score": 0.8234,
  "feature_importance": {
    "cibil_score": 0.1823,
    "loan_to_income_ratio": 0.1456,
    "income": 0.1234,
    ...
  },
  "reasons_for_rejection": [],
  "suggestions": ["Your application meets all eligibility criteria."],
  "emi": 28456.78,
  "emi_details": {
    "emi": 28456.78,
    "total_payment": 6829627.20,
    "total_interest": 3829627.20,
    "interest_rate": 7.5,
    "loan_amount": 3000000,
    "tenure_months": 240
  }
}
```

### EMI Formula
```
EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]

P = Principal (loan amount)
R = Monthly interest rate (annual rate / 12 / 100)
N = Tenure in months
```

---

## 🔐 Authentication

Currently **open** (MVP mode) — no JWT or strict auth required. Users are identified by `user_id` in requests.

---

## 📊 Database Schema

### Users Collection
| Field | Type | Description |
|-------|------|-------------|
| name | String | User's name |
| email | String | Unique email |
| role | String | individual / student / organisation |

### Applications Collection
| Field | Type | Description |
|-------|------|-------------|
| user_id | ObjectId | Reference to User |
| type | String | Applicant type |
| loan_type | String | Type of loan |
| loan_amount | Number | Requested amount |
| tenure | Number | Months |
| individual_inputs | Object | Individual-specific data |
| student_inputs | Object | Student-specific data |
| organisation_inputs | Object | Organisation-specific data |
| simulated_data | Object | Auto-generated behavioral data |
| prediction_result | Object | ML output |
| emi | Number | Calculated EMI |
| status | String | draft/submitted/predicted/approved/rejected |
| created_at | Date | Timestamp |
