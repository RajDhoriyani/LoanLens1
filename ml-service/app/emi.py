"""
LoanLens ML Service — EMI Calculator
"""
import math
from app.config import LOAN_TYPE_RATES


def get_interest_rate(loan_type: str, cibil_score: float = 700) -> float:
    """Determine interest rate based on loan type and CIBIL score."""
    rate = LOAN_TYPE_RATES.get(loan_type, 12.0)

    if cibil_score >= 800:
        rate -= 1.0
    elif cibil_score >= 750:
        rate -= 0.5
    elif cibil_score < 600:
        rate += 2.0
    elif cibil_score < 650:
        rate += 1.0

    return max(rate, 5.0)


def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> dict:
    """
    EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]

    Args:
        principal: Loan amount (P)
        annual_rate: Annual interest rate in % (e.g. 10 for 10%)
        tenure_months: Number of months (N)

    Returns:
        dict with emi, total_payment, total_interest
    """
    if principal <= 0 or tenure_months <= 0:
        return {"emi": 0, "total_payment": 0, "total_interest": 0}

    P = principal
    R = annual_rate / 12 / 100  # Monthly rate
    N = tenure_months

    if R == 0:
        emi = P / N
        return {
            "emi": round(emi, 2),
            "total_payment": round(P, 2),
            "total_interest": 0,
        }

    emi = (P * R * math.pow(1 + R, N)) / (math.pow(1 + R, N) - 1)
    total_payment = emi * N
    total_interest = total_payment - P

    return {
        "emi": round(emi, 2),
        "total_payment": round(total_payment, 2),
        "total_interest": round(total_interest, 2),
    }
