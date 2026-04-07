"""
LoanLens ML Service — Model training, feature engineering, and prediction.

Trains separate Random Forest models for individual, student, and organisation
applicants using synthetic training data generated at startup.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Dict, List, Tuple

from app.config import (
    INDIVIDUAL_FEATURES,
    STUDENT_FEATURES,
    ORGANISATION_FEATURES,
    EMPLOYMENT_MAP,
)


class LoanPredictor:
    """Trains and serves loan eligibility predictions."""

    def __init__(self):
        self.models: Dict[str, RandomForestClassifier] = {}
        self.scalers: Dict[str, StandardScaler] = {}
        self.feature_names: Dict[str, List[str]] = {
            "individual": INDIVIDUAL_FEATURES,
            "student": STUDENT_FEATURES,
            "organisation": ORGANISATION_FEATURES,
        }
        self.is_trained = False

    # ──────────────────────────────────────────
    #  SYNTHETIC DATA GENERATION
    # ──────────────────────────────────────────

    def _generate_individual_data(self, n: int = 3000) -> pd.DataFrame:
        """Generate synthetic individual loan application data."""
        np.random.seed(42)

        data = {
            "loan_amount": np.random.uniform(50000, 10000000, n),
            "tenure": np.random.randint(6, 360, n),
            "income": np.random.uniform(15000, 2500000, n),
            "current_assets": np.random.uniform(0, 50000000, n),
            "cibil_score": np.random.randint(300, 901, n),
            "age": np.random.randint(21, 65, n),
            "employment_encoded": np.random.choice([0, 1, 2, 3, 4], n, p=[0.08, 0.07, 0.15, 0.25, 0.45]),
            "upi_total_debit": np.random.uniform(1000, 200000, n),
            "upi_total_credit": np.random.uniform(5000, 500000, n),
            "upi_debit_count": np.random.randint(3, 20, n),
            "upi_credit_count": np.random.randint(1, 8, n),
            "upi_avg_debit": np.random.uniform(200, 15000, n),
            "subscription_count": np.random.randint(0, 6, n),
            "subscription_monthly_cost": np.random.uniform(0, 2500, n),
            "instagram_hours": np.random.uniform(0, 8, n),
        }

        df = pd.DataFrame(data)

        # Derived features
        df["loan_to_income_ratio"] = df["loan_amount"] / (df["income"] * 12 + 1)
        df["asset_to_loan_ratio"] = df["current_assets"] / (df["loan_amount"] + 1)
        df["monthly_savings_estimate"] = (
            df["income"] - df["upi_total_debit"] / 30 - df["subscription_monthly_cost"]
        )

        # Generate labels using a rule-based approach with noise
        score = np.zeros(n)
        score += np.where(df["cibil_score"] >= 750, 3.0, 0)
        score += np.where(df["cibil_score"] >= 650, 1.5, 0)
        score += np.where(df["cibil_score"] < 500, -3.0, 0)
        score += np.where(df["loan_to_income_ratio"] < 5, 2.0, 0)
        score += np.where(df["loan_to_income_ratio"] > 15, -2.5, 0)
        score += np.where(df["asset_to_loan_ratio"] > 1, 1.5, 0)
        score += np.where(df["employment_encoded"] >= 3, 1.5, 0)
        score += np.where(df["employment_encoded"] == 0, -2.0, 0)
        score += np.where(df["age"] >= 25, 0.5, 0)
        score += np.where(df["age"] >= 55, -0.5, 0)
        score += np.where(df["monthly_savings_estimate"] > 10000, 1.0, 0)
        score += np.where(df["instagram_hours"] > 4, -0.5, 0)
        score += np.where(df["subscription_monthly_cost"] > 1500, -0.3, 0)

        # Add noise
        score += np.random.normal(0, 1.2, n)
        df["approved"] = (score > 2.5).astype(int)

        return df

    def _generate_student_data(self, n: int = 2000) -> pd.DataFrame:
        """Generate synthetic student loan application data."""
        np.random.seed(43)

        data = {
            "loan_amount": np.random.uniform(100000, 5000000, n),
            "tenure": np.random.randint(12, 180, n),
            "guardian_income": np.random.uniform(20000, 2000000, n),
            "guardian_cibil": np.random.randint(300, 901, n),
            "student_age": np.random.randint(17, 30, n),
            "guardian_existing_loans": np.random.uniform(0, 5000000, n),
            "guardian_assets": np.random.uniform(0, 30000000, n),
            "student_income": np.random.uniform(0, 50000, n),
            "has_linkedin": np.random.choice([0, 1], n, p=[0.4, 0.6]),
            "has_github": np.random.choice([0, 1], n, p=[0.5, 0.5]),
            "upi_total_debit": np.random.uniform(500, 50000, n),
            "upi_total_credit": np.random.uniform(1000, 100000, n),
            "subscription_count": np.random.randint(0, 5, n),
            "subscription_monthly_cost": np.random.uniform(0, 1500, n),
            "instagram_hours": np.random.uniform(0, 8, n),
        }

        df = pd.DataFrame(data)

        df["guardian_loan_to_income_ratio"] = df["guardian_existing_loans"] / (
            df["guardian_income"] * 12 + 1
        )
        df["guardian_asset_to_loan_ratio"] = df["guardian_assets"] / (
            df["loan_amount"] + 1
        )

        score = np.zeros(n)
        score += np.where(df["guardian_cibil"] >= 750, 3.0, 0)
        score += np.where(df["guardian_cibil"] >= 650, 1.5, 0)
        score += np.where(df["guardian_cibil"] < 500, -3.0, 0)
        score += np.where(df["guardian_loan_to_income_ratio"] < 3, 2.0, 0)
        score += np.where(df["guardian_loan_to_income_ratio"] > 10, -2.0, 0)
        score += np.where(df["guardian_asset_to_loan_ratio"] > 1, 1.5, 0)
        score += np.where(df["has_linkedin"] == 1, 0.5, 0)
        score += np.where(df["has_github"] == 1, 0.5, 0)
        score += np.where(df["student_income"] > 10000, 0.5, 0)
        score += np.where(df["instagram_hours"] > 5, -0.3, 0)

        score += np.random.normal(0, 1.2, n)
        df["approved"] = (score > 2.0).astype(int)

        return df

    def _generate_organisation_data(self, n: int = 2000) -> pd.DataFrame:
        """Generate synthetic organisation loan application data."""
        np.random.seed(44)

        data = {
            "loan_amount": np.random.uniform(500000, 100000000, n),
            "tenure": np.random.randint(12, 240, n),
            "balance_sheet_summary": np.random.uniform(500000, 500000000, n),
            "debt_to_equity_ratio": np.random.uniform(0.1, 5.0, n),
            "current_ratio": np.random.uniform(0.3, 4.0, n),
            "revenue": np.random.uniform(1000000, 500000000, n),
            "GST_turnover": np.random.uniform(500000, 400000000, n),
            "number_of_employees": np.random.randint(5, 10000, n),
        }

        df = pd.DataFrame(data)

        df["revenue_to_loan_ratio"] = df["revenue"] / (df["loan_amount"] + 1)
        df["gst_to_revenue_ratio"] = df["GST_turnover"] / (df["revenue"] + 1)

        score = np.zeros(n)
        score += np.where(df["debt_to_equity_ratio"] < 1.0, 3.0, 0)
        score += np.where(df["debt_to_equity_ratio"] > 2.5, -2.5, 0)
        score += np.where(df["current_ratio"] > 1.5, 2.0, 0)
        score += np.where(df["current_ratio"] < 0.8, -2.0, 0)
        score += np.where(df["revenue_to_loan_ratio"] > 2, 2.0, 0)
        score += np.where(df["revenue_to_loan_ratio"] < 0.5, -2.0, 0)
        score += np.where(df["gst_to_revenue_ratio"] > 0.7, 1.0, 0)
        score += np.where(df["number_of_employees"] > 50, 0.5, 0)
        score += np.where(df["balance_sheet_summary"] > df["loan_amount"], 1.0, 0)

        score += np.random.normal(0, 1.3, n)
        df["approved"] = (score > 2.0).astype(int)

        return df

    # ──────────────────────────────────────────
    #  TRAINING
    # ──────────────────────────────────────────

    def train_all(self):
        """Train models for all three applicant types."""
        print("🧠 Training ML models...")

        generators = {
            "individual": (self._generate_individual_data, INDIVIDUAL_FEATURES),
            "student": (self._generate_student_data, STUDENT_FEATURES),
            "organisation": (self._generate_organisation_data, ORGANISATION_FEATURES),
        }

        for app_type, (gen_fn, features) in generators.items():
            df = gen_fn()
            X = df[features].values
            y = df["approved"].values

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42, stratify=y
            )

            model = RandomForestClassifier(
                n_estimators=150,
                max_depth=12,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X_train, y_train)

            accuracy = model.score(X_test, y_test)
            print(f"  ✅ {app_type:15s} → accuracy: {accuracy:.4f} | samples: {len(df)}")

            self.models[app_type] = model
            self.scalers[app_type] = scaler

        self.is_trained = True
        print("🎉 All models trained successfully!\n")

    # ──────────────────────────────────────────
    #  FEATURE ENGINEERING
    # ──────────────────────────────────────────

    def _extract_individual_features(self, data: dict) -> np.ndarray:
        """Extract feature vector for individual applicant."""
        income = data.get("income", 0) or 0
        loan_amount = data.get("loan_amount", 0) or 0
        current_assets = data.get("current_assets", 0) or 0
        upi_total_debit = data.get("upi_total_debit", 0) or 0
        subscription_monthly_cost = data.get("subscription_monthly_cost", 0) or 0

        employment = data.get("employment_status", "salaried")
        employment_encoded = EMPLOYMENT_MAP.get(employment, 2)

        features = [
            loan_amount,
            data.get("tenure", 0),
            income,
            current_assets,
            data.get("cibil_score", 0),
            data.get("age", 0),
            employment_encoded,
            upi_total_debit,
            data.get("upi_total_credit", 0),
            data.get("upi_debit_count", 0),
            data.get("upi_credit_count", 0),
            data.get("upi_avg_debit", 0),
            data.get("subscription_count", 0),
            subscription_monthly_cost,
            data.get("instagram_hours", 0),
            # Derived
            loan_amount / (income * 12 + 1),  # loan_to_income_ratio
            current_assets / (loan_amount + 1),  # asset_to_loan_ratio
            income - upi_total_debit / 30 - subscription_monthly_cost,  # monthly_savings_estimate
        ]
        return np.array(features).reshape(1, -1)

    def _extract_student_features(self, data: dict) -> np.ndarray:
        """Extract feature vector for student applicant."""
        guardian_income = data.get("guardian_income", 0) or 0
        guardian_existing_loans = data.get("guardian_existing_loans", 0) or 0
        loan_amount = data.get("loan_amount", 0) or 0
        guardian_assets = data.get("guardian_assets", 0) or 0

        features = [
            loan_amount,
            data.get("tenure", 0),
            guardian_income,
            data.get("guardian_cibil", 0),
            data.get("student_age", 0),
            guardian_existing_loans,
            guardian_assets,
            data.get("student_income", 0),
            1 if data.get("linkedin_profile") else 0,
            1 if data.get("github_profile") else 0,
            data.get("upi_total_debit", 0),
            data.get("upi_total_credit", 0),
            data.get("subscription_count", 0),
            data.get("subscription_monthly_cost", 0),
            data.get("instagram_hours", 0),
            # Derived
            guardian_existing_loans / (guardian_income * 12 + 1),
            guardian_assets / (loan_amount + 1),
        ]
        return np.array(features).reshape(1, -1)

    def _extract_organisation_features(self, data: dict) -> np.ndarray:
        """Extract feature vector for organisation applicant."""
        loan_amount = data.get("loan_amount", 0) or 0
        revenue = data.get("revenue", 0) or 0
        gst = data.get("GST_turnover", 0) or 0

        features = [
            loan_amount,
            data.get("tenure", 0),
            data.get("balance_sheet_summary", 0),
            data.get("debt_to_equity_ratio", 0),
            data.get("current_ratio", 0),
            revenue,
            gst,
            data.get("number_of_employees", 0),
            # Derived
            revenue / (loan_amount + 1),
            gst / (revenue + 1),
        ]
        return np.array(features).reshape(1, -1)

    # ──────────────────────────────────────────
    #  PREDICTION
    # ──────────────────────────────────────────

    def predict(self, data: dict) -> dict:
        """
        Run prediction for a loan application.

        Returns:
            dict with approval, probability_score, feature_importance,
            reasons_for_rejection, suggestions
        """
        app_type = data.get("type", "individual")

        if app_type not in self.models:
            raise ValueError(f"No model trained for type: {app_type}")

        model = self.models[app_type]
        scaler = self.scalers[app_type]
        feature_names = self.feature_names[app_type]

        # Extract features
        if app_type == "individual":
            X = self._extract_individual_features(data)
        elif app_type == "student":
            X = self._extract_student_features(data)
        else:
            X = self._extract_organisation_features(data)

        # Scale
        X_scaled = scaler.transform(X)

        # Predict
        prediction = model.predict(X_scaled)[0]
        probabilities = model.predict_proba(X_scaled)[0]
        prob_approved = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])

        # Feature importance
        importances = model.feature_importances_
        feature_importance = {
            name: round(float(imp), 4)
            for name, imp in sorted(
                zip(feature_names, importances), key=lambda x: x[1], reverse=True
            )
        }

        # Analyze reasons and suggestions
        reasons, suggestions = self._analyze_decision(data, app_type, prediction, X[0], feature_names)

        return {
            "approval": int(prediction),
            "probability_score": round(prob_approved, 4),
            "feature_importance": feature_importance,
            "reasons_for_rejection": reasons,
            "suggestions": suggestions,
        }

    # ──────────────────────────────────────────
    #  DECISION ANALYSIS
    # ──────────────────────────────────────────

    def _analyze_decision(
        self,
        data: dict,
        app_type: str,
        prediction: int,
        features: np.ndarray,
        feature_names: List[str],
    ) -> Tuple[List[str], List[str]]:
        """Generate human-readable reasons and suggestions."""
        reasons = []
        suggestions = []

        if app_type == "individual":
            cibil = data.get("cibil_score", 0)
            income = data.get("income", 0)
            loan_amount = data.get("loan_amount", 0)
            assets = data.get("current_assets", 0)
            age = data.get("age", 0)
            employment = data.get("employment_status", "salaried")
            instagram = data.get("instagram_hours", 0)
            subs_cost = data.get("subscription_monthly_cost", 0)

            if cibil < 650:
                reasons.append(f"Low CIBIL score ({cibil}). Minimum recommended: 650.")
                suggestions.append("Improve CIBIL score by paying existing dues on time and reducing credit utilization.")
            if income > 0 and loan_amount / (income * 12) > 10:
                reasons.append("Loan amount is very high relative to annual income.")
                suggestions.append("Consider a lower loan amount or provide collateral to strengthen application.")
            if assets < loan_amount * 0.1:
                reasons.append("Current assets are insufficient relative to loan amount.")
                suggestions.append("Build up savings/assets before applying. Even 10-20% of loan as assets helps.")
            if employment in ["unemployed"]:
                reasons.append("Unemployment significantly reduces eligibility.")
                suggestions.append("Secure stable employment or show alternative income sources.")
            if age < 23:
                reasons.append(f"Age ({age}) is below the typical minimum for this loan type.")
                suggestions.append("Consider applying with a co-applicant or guarantor.")
            if instagram > 5:
                suggestions.append("High social media usage may indicate lifestyle spending patterns. Reducing discretionary spending can help.")
            if subs_cost > 1000:
                suggestions.append("Consider reducing entertainment subscription costs to improve financial profile.")

        elif app_type == "student":
            g_cibil = data.get("guardian_cibil", 0)
            g_income = data.get("guardian_income", 0)
            g_loans = data.get("guardian_existing_loans", 0)
            g_assets = data.get("guardian_assets", 0)
            loan_amount = data.get("loan_amount", 0)
            has_linkedin = bool(data.get("linkedin_profile"))
            has_github = bool(data.get("github_profile"))

            if g_cibil < 650:
                reasons.append(f"Guardian CIBIL score ({g_cibil}) is below recommended threshold.")
                suggestions.append("Guardian should improve CIBIL by clearing existing debts.")
            if g_income > 0 and g_loans / (g_income * 12) > 5:
                reasons.append("Guardian has high existing loan burden relative to income.")
                suggestions.append("Guardian should reduce existing loans before co-signing.")
            if g_assets < loan_amount * 0.2:
                reasons.append("Guardian's assets are low compared to loan amount.")
                suggestions.append("Provide additional collateral or reduce loan amount.")
            if not has_linkedin:
                suggestions.append("Adding a LinkedIn profile demonstrates professional seriousness and can improve eligibility.")
            if not has_github:
                suggestions.append("A GitHub profile with projects shows technical aptitude — consider adding one.")

        elif app_type == "organisation":
            dte = data.get("debt_to_equity_ratio", 0)
            cr = data.get("current_ratio", 0)
            revenue = data.get("revenue", 0)
            loan_amount = data.get("loan_amount", 0)
            gst = data.get("GST_turnover", 0)
            employees = data.get("number_of_employees", 0)

            if dte > 2.0:
                reasons.append(f"Debt-to-equity ratio ({dte:.2f}) is too high. Maximum recommended: 2.0.")
                suggestions.append("Reduce existing debt or increase equity investment.")
            if cr < 1.0:
                reasons.append(f"Current ratio ({cr:.2f}) is below 1.0, indicating liquidity concerns.")
                suggestions.append("Improve current ratio by increasing current assets or reducing current liabilities.")
            if revenue > 0 and loan_amount / revenue > 3:
                reasons.append("Loan amount significantly exceeds annual revenue.")
                suggestions.append("Consider phased borrowing or reducing the loan amount.")
            if revenue > 0 and gst / revenue < 0.5:
                reasons.append("GST turnover is low relative to reported revenue.")
                suggestions.append("Ensure GST compliance. Higher GST turnover validates revenue claims.")
            if employees < 10:
                suggestions.append("Organizations with larger teams are viewed more favorably. Consider growth before applying.")

        # If approved, clear rejection reasons
        if prediction == 1:
            reasons = []
            if not suggestions:
                suggestions.append("Your application meets all eligibility criteria. Congratulations!")

        # If rejected but no specific reasons found
        if prediction == 0 and not reasons:
            reasons.append("Application does not meet the overall eligibility threshold based on combined factors.")
            suggestions.append("Review all input parameters and try to improve financial indicators.")

        return reasons, suggestions
