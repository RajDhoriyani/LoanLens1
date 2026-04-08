"""
LoanLens ML Service — Configuration
"""

# Feature columns for each applicant type
INDIVIDUAL_FEATURES = [
    "loan_amount",
    "tenure",
    "income",
    "current_assets",
    "cibil_score",
    "age",
    "employment_encoded",
    "upi_total_debit",
    "upi_total_credit",
    "upi_debit_count",
    "upi_credit_count",
    "upi_avg_debit",
    "subscription_count",
    "subscription_monthly_cost",
    "instagram_hours",
    "loan_to_income_ratio",
    "asset_to_loan_ratio",
    "monthly_savings_estimate",
]

STUDENT_FEATURES = [
    "loan_amount",
    "tenure",
    "guardian_income",
    "guardian_cibil",
    "student_age",
    "guardian_existing_loans",
    "guardian_assets",
    "student_income",
    "has_linkedin",
    "has_github",
    "upi_total_debit",
    "upi_total_credit",
    "subscription_count",
    "subscription_monthly_cost",
    "instagram_hours",
    "guardian_loan_to_income_ratio",
    "guardian_asset_to_loan_ratio",
]

ORGANISATION_FEATURES = [
    "loan_amount",
    "tenure",
    "balance_sheet_summary",
    "debt_to_equity_ratio",
    "current_ratio",
    "revenue",
    "GST_turnover",
    "number_of_employees",
    "revenue_to_loan_ratio",
    "gst_to_revenue_ratio",
]

EMPLOYMENT_MAP = {
    "salaried": 4,
    "business_owner": 3,
    "self_employed": 3,
    "freelancer": 2,
    "retired": 1,
    "unemployed": 0,
}

LOAN_TYPE_RATES = {
    "home": 8.5,
    "car": 9.5,
    "personal": 12.0,
    "medical": 11.0,
    "educational": 8.0,
    "professional": 10.5,
    "gold": 7.5,
    "loan_against_property": 9.0,
    "business_expansion": 11.5,
    "startup": 13.0,
}
