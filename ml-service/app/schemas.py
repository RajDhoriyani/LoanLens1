"""
LoanLens ML Service — Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class PredictionRequest(BaseModel):
    """Incoming prediction request from Node.js backend."""

    # Common fields
    type: str = Field(..., description="individual | student | organisation")
    loan_type: str = Field(..., description="Type of loan")
    loan_amount: float = Field(..., gt=0)
    tenure: int = Field(..., gt=0, le=360, description="Tenure in months")

    # Individual fields
    income: Optional[float] = 0
    current_assets: Optional[float] = 0
    cibil_score: Optional[float] = 0
    age: Optional[int] = 0
    employment_status: Optional[str] = "salaried"

    # Student fields
    guardian_income: Optional[float] = 0
    guardian_cibil: Optional[float] = 0
    student_age: Optional[int] = 0
    guardian_existing_loans: Optional[float] = 0
    guardian_assets: Optional[float] = 0
    student_income: Optional[float] = 0
    linkedin_profile: Optional[str] = ""
    github_profile: Optional[str] = ""

    # Organisation fields
    balance_sheet_summary: Optional[float] = 0
    debt_to_equity_ratio: Optional[float] = 0
    current_ratio: Optional[float] = 0
    revenue: Optional[float] = 0
    GST_turnover: Optional[float] = 0
    number_of_employees: Optional[int] = 0

    # Simulated data aggregates
    upi_total_debit: Optional[float] = 0
    upi_total_credit: Optional[float] = 0
    upi_debit_count: Optional[int] = 0
    upi_credit_count: Optional[int] = 0
    upi_avg_debit: Optional[float] = 0
    subscription_count: Optional[int] = 0
    subscription_monthly_cost: Optional[float] = 0
    instagram_hours: Optional[float] = 0


class PredictionResponse(BaseModel):
    """Prediction output returned to the backend."""

    approval: int = Field(..., description="1 = approved, 0 = rejected")
    probability_score: float = Field(
        ..., ge=0, le=1, description="Probability of approval"
    )
    feature_importance: Dict[str, float] = Field(
        default_factory=dict, description="Feature name → importance score"
    )
    reasons_for_rejection: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    emi: Optional[float] = None
    emi_details: Optional[Dict] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
