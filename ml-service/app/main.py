"""
LoanLens ML Service — FastAPI Application

Endpoints:
    GET  /           → Health check
    GET  /health     → Health status
    POST /predict    → Run loan eligibility prediction
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.schemas import PredictionRequest, PredictionResponse, HealthResponse
from app.model import LoanPredictor
from app.emi import calculate_emi, get_interest_rate


# ──────────────────────────────────────────
#  Global model instance
# ──────────────────────────────────────────
predictor = LoanPredictor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train models on startup."""
    print("\n🚀 Starting LoanLens ML Service...")
    predictor.train_all()
    yield
    print("👋 Shutting down ML Service...")


# ──────────────────────────────────────────
#  FastAPI App
# ──────────────────────────────────────────
app = FastAPI(
    title="LoanLens ML Service",
    description="Machine Learning service for loan eligibility prediction",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────

@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        status="running",
        model_loaded=predictor.is_trained,
        version="1.0.0",
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=predictor.is_trained,
        version="1.0.0",
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Run loan eligibility prediction.

    Accepts application data and returns:
    - approval (0 or 1)
    - probability score
    - feature importance dictionary
    - reasons for rejection
    - suggestions to improve eligibility
    - EMI details
    """
    if not predictor.is_trained:
        raise HTTPException(status_code=503, detail="Models are not yet trained. Please wait.")

    try:
        data = request.model_dump()
        result = predictor.predict(data)

        # Calculate EMI
        cibil = data.get("cibil_score") or data.get("guardian_cibil") or 700
        interest_rate = get_interest_rate(data["loan_type"], cibil)
        emi_result = calculate_emi(data["loan_amount"], interest_rate, data["tenure"])

        result["emi"] = emi_result["emi"]
        result["emi_details"] = {
            **emi_result,
            "interest_rate": interest_rate,
            "loan_amount": data["loan_amount"],
            "tenure_months": data["tenure"],
        }

        return PredictionResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
