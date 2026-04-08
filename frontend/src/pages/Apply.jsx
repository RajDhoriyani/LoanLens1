import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineCurrencyRupee,
  HiOutlineClipboardCheck,
} from "react-icons/hi";
import { applyForLoan, predictLoan } from "../api";
import { useAuth } from "../context/AuthContext";
import Dropdown from "../components/Dropdown";
import "./Apply.css";

const LOAN_TYPES = [
  { value: "home", label: "Home Loan" },
  { value: "car", label: "Car Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "medical", label: "Medical Loan" },
  { value: "educational", label: "Educational Loan" },
  { value: "professional", label: "Professional Loan" },
  { value: "gold", label: "Gold Loan" },
  { value: "loan_against_property", label: "Loan Against Property" },
];

const ORG_LOAN_TYPES = [
  { value: "business_expansion", label: "Business Expansion Loan" },
  { value: "startup", label: "Startup Loan" },
];

const STUDENT_LOAN_TYPES = [
  { value: "educational", label: "Educational Loan" },
];

const STEPS_INDIVIDUAL = ["Loan Details", "Financial Profile", "Review & Submit"];
const STEPS_STUDENT = ["Loan Details", "Guardian & Student Info", "Review & Submit"];
const STEPS_ORG = ["Loan Details", "Organisation Financials", "Review & Submit"];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

export default function Apply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userType, setUserType] = useState(user?.role || "individual");

  const [loanData, setLoanData] = useState({
    loan_type: "home",
    loan_amount: "",
    tenure: "",
  });

  const [individualInputs, setIndividualInputs] = useState({
    income: "",
    current_assets: "",
    cibil_score: "",
    age: "",
    employment_status: "salaried",
  });

  const [studentInputs, setStudentInputs] = useState({
    guardian_income: "",
    guardian_cibil: "",
    student_age: "",
    guardian_existing_loans: "",
    guardian_assets: "",
    student_income: "",
    linkedin_profile: "",
    github_profile: "",
  });

  const [orgInputs, setOrgInputs] = useState({
    balance_sheet_summary: "",
    debt_to_equity_ratio: "",
    current_ratio: "",
    revenue: "",
    GST_turnover: "",
    number_of_employees: "",
  });

  const steps =
    userType === "student"
      ? STEPS_STUDENT
      : userType === "organisation"
      ? STEPS_ORG
      : STEPS_INDIVIDUAL;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Use logged-in user
      const userId = user._id;

      // 2. Submit application
      const appPayload = {
        user_id: userId,
        type: userType,
        loan_type: loanData.loan_type,
        loan_amount: Number(loanData.loan_amount),
        tenure: Number(loanData.tenure),
      };

      if (userType === "individual") {
        appPayload.individual_inputs = {
          income: Number(individualInputs.income),
          current_assets: Number(individualInputs.current_assets),
          cibil_score: Number(individualInputs.cibil_score),
          age: Number(individualInputs.age),
          employment_status: individualInputs.employment_status,
        };
      } else if (userType === "student") {
        appPayload.student_inputs = {
          guardian_income: Number(studentInputs.guardian_income),
          guardian_cibil: Number(studentInputs.guardian_cibil),
          student_age: Number(studentInputs.student_age),
          guardian_existing_loans: Number(studentInputs.guardian_existing_loans || 0),
          guardian_assets: Number(studentInputs.guardian_assets || 0),
          student_income: Number(studentInputs.student_income || 0),
          linkedin_profile: studentInputs.linkedin_profile,
          github_profile: studentInputs.github_profile,
        };
      } else {
        appPayload.organisation_inputs = {
          balance_sheet_summary: Number(orgInputs.balance_sheet_summary),
          debt_to_equity_ratio: Number(orgInputs.debt_to_equity_ratio),
          current_ratio: Number(orgInputs.current_ratio),
          revenue: Number(orgInputs.revenue),
          GST_turnover: Number(orgInputs.GST_turnover),
          number_of_employees: Number(orgInputs.number_of_employees),
        };
      }

      const appRes = await applyForLoan(appPayload);
      const applicationId = appRes.data.data.application._id;

      // 3. Run prediction
      const predRes = await predictLoan(applicationId);

      // 4. Navigate to results
      navigate(`/results/${applicationId}`, {
        state: { prediction: predRes.data.data, application: appRes.data.data },
      });
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.errors?.join(", ") ||
        err.response?.data?.error ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (setter) => (e) => {
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ─── Step Renderers ─── */

  const renderStep0 = () => (
    <div className="form-step">
      <h3 className="step-heading">
        <HiOutlineCurrencyRupee /> Loan Details
      </h3>

      {/* User Type Selector */}
      <div className="form-group">
        <label className="form-label">Applicant Type</label>
        <div className="type-selector">
          {["individual", "student", "organisation"].map((t) => (
            <button
              key={t}
              type="button"
              className={`type-btn ${userType === t ? "active" : ""}`}
              onClick={() => {
                setUserType(t);
                if (t === "student") {
                  setLoanData((p) => ({ ...p, loan_type: "educational" }));
                } else if (t === "organisation") {
                  setLoanData((p) => ({ ...p, loan_type: "business_expansion" }));
                } else {
                  setLoanData((p) => ({ ...p, loan_type: "home" }));
                }
              }}
            >
              {t === "individual" && "Individual"}
              {t === "student" && "Student"}
              {t === "organisation" && "Organisation"}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <Dropdown
          label="Loan Type"
          name="loan_type"
          value={loanData.loan_type}
          onChange={updateField(setLoanData)}
          options={userType === "organisation" ? ORG_LOAN_TYPES : userType === "student" ? STUDENT_LOAN_TYPES : LOAN_TYPES}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Loan Amount (₹)</label>
          <input
            className="form-input"
            name="loan_amount"
            type="number"
            value={loanData.loan_amount}
            onChange={updateField(setLoanData)}
            placeholder="e.g. 3000000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tenure (months)</label>
          <input
            className="form-input"
            name="tenure"
            type="number"
            value={loanData.tenure}
            onChange={updateField(setLoanData)}
            placeholder="e.g. 240"
          />
        </div>
      </div>
    </div>
  );

  const renderStep1Individual = () => (
    <div className="form-step">
      <h3 className="step-heading">
        <HiOutlineUser /> Financial Profile
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Monthly Income (₹)</label>
          <input
            className="form-input"
            name="income"
            type="number"
            value={individualInputs.income}
            onChange={updateField(setIndividualInputs)}
            placeholder="e.g. 120000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Current Assets (₹)</label>
          <input
            className="form-input"
            name="current_assets"
            type="number"
            value={individualInputs.current_assets}
            onChange={updateField(setIndividualInputs)}
            placeholder="e.g. 1500000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">CIBIL Score</label>
          <input
            className="form-input"
            name="cibil_score"
            type="number"
            min="300"
            max="900"
            value={individualInputs.cibil_score}
            onChange={updateField(setIndividualInputs)}
            placeholder="300 – 900"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Age</label>
          <input
            className="form-input"
            name="age"
            type="number"
            value={individualInputs.age}
            onChange={updateField(setIndividualInputs)}
            placeholder="e.g. 32"
          />
        </div>
      </div>

      <div className="form-group">
        <Dropdown
          label="Employment Status"
          name="employment_status"
          value={individualInputs.employment_status}
          onChange={updateField(setIndividualInputs)}
          options={[
            { value: "salaried", label: "Salaried" },
            { value: "self_employed", label: "Self Employed" },
            { value: "business_owner", label: "Business Owner" },
            { value: "freelancer", label: "Freelancer" },
            { value: "retired", label: "Retired" },
            { value: "unemployed", label: "Unemployed" },
          ]}
        />
      </div>
    </div>
  );

  const renderStep1Student = () => (
    <div className="form-step">
      <h3 className="step-heading">
        <HiOutlineUser /> Guardian & Student Info
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Guardian Income (₹/month)</label>
          <input
            className="form-input"
            name="guardian_income"
            type="number"
            value={studentInputs.guardian_income}
            onChange={updateField(setStudentInputs)}
            placeholder="e.g. 85000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Guardian CIBIL Score</label>
          <input
            className="form-input"
            name="guardian_cibil"
            type="number"
            value={studentInputs.guardian_cibil}
            onChange={updateField(setStudentInputs)}
            placeholder="300 – 900"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Student Age</label>
          <input
            className="form-input"
            name="student_age"
            type="number"
            value={studentInputs.student_age}
            onChange={updateField(setStudentInputs)}
            placeholder="e.g. 21"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Guardian Existing Loans (₹)</label>
          <input
            className="form-input"
            name="guardian_existing_loans"
            type="number"
            value={studentInputs.guardian_existing_loans}
            onChange={updateField(setStudentInputs)}
            placeholder="e.g. 200000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Guardian Assets (₹)</label>
          <input
            className="form-input"
            name="guardian_assets"
            type="number"
            value={studentInputs.guardian_assets}
            onChange={updateField(setStudentInputs)}
            placeholder="e.g. 3000000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Student Income (₹, optional)</label>
          <input
            className="form-input"
            name="student_income"
            type="number"
            value={studentInputs.student_income}
            onChange={updateField(setStudentInputs)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">LinkedIn Profile</label>
          <input
            className="form-input"
            name="linkedin_profile"
            value={studentInputs.linkedin_profile}
            onChange={updateField(setStudentInputs)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">GitHub Profile</label>
          <input
            className="form-input"
            name="github_profile"
            value={studentInputs.github_profile}
            onChange={updateField(setStudentInputs)}
            placeholder="https://github.com/..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep1Org = () => (
    <div className="form-step">
      <h3 className="step-heading">
        <HiOutlineUser /> Organisation Financials
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Balance Sheet Summary (₹)</label>
          <input
            className="form-input"
            name="balance_sheet_summary"
            type="number"
            value={orgInputs.balance_sheet_summary}
            onChange={updateField(setOrgInputs)}
            placeholder="e.g. 50000000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Revenue (₹)</label>
          <input
            className="form-input"
            name="revenue"
            type="number"
            value={orgInputs.revenue}
            onChange={updateField(setOrgInputs)}
            placeholder="e.g. 80000000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Debt-to-Equity Ratio</label>
          <input
            className="form-input"
            name="debt_to_equity_ratio"
            type="number"
            step="0.01"
            value={orgInputs.debt_to_equity_ratio}
            onChange={updateField(setOrgInputs)}
            placeholder="e.g. 0.8"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Current Ratio</label>
          <input
            className="form-input"
            name="current_ratio"
            type="number"
            step="0.01"
            value={orgInputs.current_ratio}
            onChange={updateField(setOrgInputs)}
            placeholder="e.g. 2.1"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">GST Turnover (₹)</label>
          <input
            className="form-input"
            name="GST_turnover"
            type="number"
            value={orgInputs.GST_turnover}
            onChange={updateField(setOrgInputs)}
            placeholder="e.g. 65000000"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Number of Employees</label>
          <input
            className="form-input"
            name="number_of_employees"
            type="number"
            value={orgInputs.number_of_employees}
            onChange={updateField(setOrgInputs)}
            placeholder="e.g. 150"
          />
        </div>
      </div>
    </div>
  );

  const renderReview = () => {
    const inputs =
      userType === "individual"
        ? individualInputs
        : userType === "student"
        ? studentInputs
        : orgInputs;

    const formatNum = (n) => {
      if (!n) return "—";
      return Number(n).toLocaleString("en-IN");
    };

    return (
      <div className="form-step">
        <h3 className="step-heading">
          <HiOutlineClipboardCheck /> Review & Submit
        </h3>

        <div className="review-section">
          <h4 className="review-group-title">Applicant</h4>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Name</span>
              <span className="review-value">{user?.name || "—"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Email</span>
              <span className="review-value">{user?.email || "—"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Type</span>
              <span className="review-value capitalize">{userType}</span>
            </div>
          </div>
        </div>

        <div className="review-section">
          <h4 className="review-group-title">Loan</h4>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Loan Type</span>
              <span className="review-value capitalize">
                {loanData.loan_type.replace(/_/g, " ")}
              </span>
            </div>
            <div className="review-item">
              <span className="review-label">Amount</span>
              <span className="review-value">₹{formatNum(loanData.loan_amount)}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Tenure</span>
              <span className="review-value">{loanData.tenure} months</span>
            </div>
          </div>
        </div>

        <div className="review-section">
          <h4 className="review-group-title">Financial Details</h4>
          <div className="review-grid">
            {Object.entries(inputs).map(([key, val]) => (
              <div key={key} className="review-item">
                <span className="review-label">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="review-value">
                  {typeof val === "number" || !isNaN(Number(val))
                    ? formatNum(val)
                    : val || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (step === 0) return renderStep0();
    if (step === 1) {
      if (userType === "individual") return renderStep1Individual();
      if (userType === "student") return renderStep1Student();
      return renderStep1Org();
    }
    return renderReview();
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="apply-page">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="section-title">Apply for a Loan</h1>
            <p className="section-subtitle">
              Fill in your details and get an instant AI-powered eligibility check
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="stepper">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`stepper-item ${i <= step ? "active" : ""} ${
                  i < step ? "completed" : ""
                }`}
              >
                <div className="stepper-circle">
                  {i < step ? <HiOutlineCheck /> : i + 1}
                </div>
                <span className="stepper-label">{s}</span>
                {i < steps.length - 1 && <div className="stepper-line" />}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="apply-card glass-card">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="form-nav">
              {step > 0 && (
                <button className="btn btn-secondary" onClick={goBack}>
                  <HiOutlineArrowLeft /> Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < steps.length - 1 ? (
                <button className="btn btn-primary" onClick={goNext}>
                  Next <HiOutlineArrowRight />
                </button>
              ) : (
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 20, height: 20 }} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Submit & Predict <HiOutlineArrowRight />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
