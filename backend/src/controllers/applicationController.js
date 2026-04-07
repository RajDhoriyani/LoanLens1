const axios = require("axios");
const Application = require("../models/Application");
const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");
const { generateSimulatedData } = require("../utils/simulatedData");
const { calculateEMI, getInterestRate } = require("../utils/emiCalculator");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000";

/* ──────────────────────────────────────────────
   POST /api/apply
   Create a loan application.
   ────────────────────────────────────────────── */
const applyForLoan = asyncHandler(async (req, res) => {
  const {
    user_id,
    type,
    loan_type,
    loan_amount,
    tenure,
    individual_inputs,
    student_inputs,
    organisation_inputs,
    simulated_data,
  } = req.body;

  // Verify user exists
  const user = await User.findById(user_id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  // Determine income for simulated data generation
  let income = 50000; // default
  if (type === "individual" && individual_inputs?.income) {
    income = individual_inputs.income;
  } else if (type === "student" && student_inputs?.guardian_income) {
    income = student_inputs.guardian_income;
  }

  // Auto-generate simulated data if not provided (for individual/student)
  let finalSimulatedData = simulated_data || null;
  if (!finalSimulatedData && (type === "individual" || type === "student")) {
    finalSimulatedData = generateSimulatedData(income);
  }

  // Calculate EMI
  const cibilScore =
    type === "individual"
      ? individual_inputs?.cibil_score
      : type === "student"
      ? student_inputs?.guardian_cibil
      : 700;

  const interestRate = getInterestRate(loan_type, cibilScore || 700);
  const emiResult = calculateEMI(loan_amount, interestRate, tenure);

  // Build application document
  const applicationData = {
    user_id,
    type,
    loan_type,
    loan_amount,
    tenure,
    emi: emiResult.emi,
    simulated_data: finalSimulatedData,
    status: "submitted",
  };

  // Attach role-specific inputs
  if (type === "individual") applicationData.individual_inputs = individual_inputs;
  if (type === "student") applicationData.student_inputs = student_inputs;
  if (type === "organisation") applicationData.organisation_inputs = organisation_inputs;

  const application = await Application.create(applicationData);

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: {
      application,
      emi_details: {
        ...emiResult,
        interest_rate: interestRate,
      },
    },
  });
});

/* ──────────────────────────────────────────────
   GET /api/applications
   List all applications (with optional filters).
   ────────────────────────────────────────────── */
const getApplications = asyncHandler(async (req, res) => {
  const { user_id, type, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (user_id) filter.user_id = user_id;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("user_id", "name email role")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: applications.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: applications,
  });
});

/* ──────────────────────────────────────────────
   GET /api/application/:id
   Get single application by ID.
   ────────────────────────────────────────────── */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate(
    "user_id",
    "name email role"
  );

  if (!application) {
    return res
      .status(404)
      .json({ success: false, error: "Application not found" });
  }

  res.json({ success: true, data: application });
});

/* ──────────────────────────────────────────────
   POST /api/predict
   Call Python ML service for prediction.
   ────────────────────────────────────────────── */
const predictLoan = asyncHandler(async (req, res) => {
  const { application_id } = req.body;

  if (!application_id) {
    return res
      .status(400)
      .json({ success: false, error: "application_id is required" });
  }

  const application = await Application.findById(application_id);
  if (!application) {
    return res
      .status(404)
      .json({ success: false, error: "Application not found" });
  }

  // Build payload for ML service
  const mlPayload = buildMLPayload(application);

  let prediction;
  try {
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      mlPayload,
      { timeout: 30000 }
    );
    prediction = mlResponse.data;
  } catch (err) {
    console.error("ML Service Error:", err.message);
    return res.status(502).json({
      success: false,
      error: "ML service unavailable",
      details: err.message,
    });
  }

  // Calculate EMI
  const cibilScore = mlPayload.cibil_score || 700;
  const interestRate = getInterestRate(
    application.loan_type,
    cibilScore
  );
  const emiResult = calculateEMI(
    application.loan_amount,
    interestRate,
    application.tenure
  );

  // Update application with prediction
  application.prediction_result = {
    approval: prediction.approval,
    probability_score: prediction.probability_score,
    feature_importance: prediction.feature_importance,
    reasons_for_rejection: prediction.reasons_for_rejection || [],
    suggestions: prediction.suggestions || [],
    predicted_at: new Date(),
  };
  application.emi = emiResult.emi;
  application.status = prediction.approval === 1 ? "approved" : "rejected";

  await application.save();

  res.json({
    success: true,
    message: "Prediction completed",
    data: {
      application_id: application._id,
      approval: prediction.approval,
      probability_score: prediction.probability_score,
      feature_importance: prediction.feature_importance,
      reasons_for_rejection: prediction.reasons_for_rejection,
      suggestions: prediction.suggestions,
      emi_details: {
        ...emiResult,
        interest_rate: interestRate,
      },
    },
  });
});

/* ──────────────────────────────────────────────
   Helper: Build ML payload from application.
   ────────────────────────────────────────────── */
function buildMLPayload(app) {
  const base = {
    type: app.type,
    loan_type: app.loan_type,
    loan_amount: app.loan_amount,
    tenure: app.tenure,
  };

  if (app.type === "individual" && app.individual_inputs) {
    const inp = app.individual_inputs;
    Object.assign(base, {
      income: inp.income || 0,
      current_assets: inp.current_assets || 0,
      cibil_score: inp.cibil_score || 0,
      age: inp.age || 0,
      employment_status: inp.employment_status || "salaried",
    });
  }

  if (app.type === "student" && app.student_inputs) {
    const inp = app.student_inputs;
    Object.assign(base, {
      guardian_income: inp.guardian_income || 0,
      guardian_cibil: inp.guardian_cibil || 0,
      student_age: inp.student_age || 0,
      guardian_existing_loans: inp.guardian_existing_loans || 0,
      guardian_assets: inp.guardian_assets || 0,
      student_income: inp.student_income || 0,
      linkedin_profile: inp.linkedin_profile || "",
      github_profile: inp.github_profile || "",
    });
  }

  if (app.type === "organisation" && app.organisation_inputs) {
    const inp = app.organisation_inputs;
    Object.assign(base, {
      balance_sheet_summary: inp.balance_sheet_summary || 0,
      debt_to_equity_ratio: inp.debt_to_equity_ratio || 0,
      current_ratio: inp.current_ratio || 0,
      revenue: inp.revenue || 0,
      GST_turnover: inp.GST_turnover || 0,
      number_of_employees: inp.number_of_employees || 0,
    });
  }

  // Simulated data features
  if (app.simulated_data) {
    const sim = app.simulated_data;

    // UPI aggregates
    if (sim.upi_transactions && sim.upi_transactions.length) {
      const txns = sim.upi_transactions;
      const totalDebit = txns
        .filter((t) => t.type === "debit")
        .reduce((s, t) => s + t.amount, 0);
      const totalCredit = txns
        .filter((t) => t.type === "credit")
        .reduce((s, t) => s + t.amount, 0);
      base.upi_total_debit = totalDebit;
      base.upi_total_credit = totalCredit;
      base.upi_debit_count = txns.filter((t) => t.type === "debit").length;
      base.upi_credit_count = txns.filter((t) => t.type === "credit").length;
      base.upi_avg_debit =
        base.upi_debit_count > 0 ? totalDebit / base.upi_debit_count : 0;
    }

    // Subscriptions
    if (sim.entertainment_subscriptions) {
      const subs = sim.entertainment_subscriptions;
      base.subscription_count = subs.filter((s) => s.active).length;
      base.subscription_monthly_cost = subs
        .filter((s) => s.active)
        .reduce((s, sub) => s + sub.monthly_cost, 0);
    }

    // Social media
    if (sim.social_media_usage && sim.social_media_usage.length) {
      base.instagram_hours =
        sim.social_media_usage[0].usage_hours_per_day || 0;
    }
  }

  return base;
}

module.exports = {
  applyForLoan,
  getApplications,
  getApplicationById,
  predictLoan,
};
