const mongoose = require("mongoose");

/* ─── Sub-schemas ─── */

const upiTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    monthly_cost: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const socialMediaSchema = new mongoose.Schema(
  {
    platform: { type: String, default: "Instagram" },
    usage_hours_per_day: { type: Number, default: 0 },
  },
  { _id: false }
);

const simulatedDataSchema = new mongoose.Schema(
  {
    upi_transactions: [upiTransactionSchema],
    entertainment_subscriptions: [subscriptionSchema],
    social_media_usage: [socialMediaSchema],
  },
  { _id: false }
);

/* ─── Individual Inputs ─── */
const individualInputsSchema = new mongoose.Schema(
  {
    income: { type: Number },
    current_assets: { type: Number },
    cibil_score: { type: Number, min: 300, max: 900 },
    age: { type: Number },
    employment_status: { type: String },
  },
  { _id: false }
);

/* ─── Student Inputs ─── */
const studentInputsSchema = new mongoose.Schema(
  {
    guardian_income: { type: Number, required: true },
    guardian_cibil: { type: Number, min: 300, max: 900 },
    student_age: { type: Number },
    guardian_existing_loans: { type: Number, default: 0 },
    guardian_assets: { type: Number, default: 0 },
    student_income: { type: Number, default: 0 },
    linkedin_profile: { type: String, default: "" },
    github_profile: { type: String, default: "" },
  },
  { _id: false }
);

/* ─── Organisation Inputs ─── */
const organisationInputsSchema = new mongoose.Schema(
  {
    balance_sheet_summary: { type: Number },
    debt_to_equity_ratio: { type: Number },
    current_ratio: { type: Number },
    revenue: { type: Number },
    GST_turnover: { type: Number },
    number_of_employees: { type: Number },
  },
  { _id: false }
);

/* ─── Prediction Result ─── */
const predictionResultSchema = new mongoose.Schema(
  {
    approval: { type: Number, enum: [0, 1] },
    probability_score: { type: Number },
    feature_importance: { type: Map, of: Number },
    reasons_for_rejection: [{ type: String }],
    suggestions: [{ type: String }],
    predicted_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ─── Main Application Schema ─── */
const applicationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["individual", "student", "organisation"],
      required: true,
    },
    loan_type: {
      type: String,
      enum: [
        "home",
        "car",
        "personal",
        "medical",
        "educational",
        "professional",
        "gold",
        "loan_against_property",
      ],
      required: true,
    },
    loan_amount: {
      type: Number,
      required: true,
      min: 1000,
    },
    tenure: {
      type: Number,
      required: true,
      min: 1,
      max: 360,
      comment: "Tenure in months",
    },

    // Role-specific inputs (only one will be populated)
    individual_inputs: individualInputsSchema,
    student_inputs: studentInputsSchema,
    organisation_inputs: organisationInputsSchema,

    // Simulated behavioural data
    simulated_data: simulatedDataSchema,

    // ML prediction output
    prediction_result: predictionResultSchema,

    // EMI
    emi: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "submitted", "predicted", "approved", "rejected"],
      default: "submitted",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes
applicationSchema.index({ user_id: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ type: 1 });
applicationSchema.index({ created_at: -1 });

module.exports = mongoose.model("Application", applicationSchema);
