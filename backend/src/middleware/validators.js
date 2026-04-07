const { LOAN_TYPES, USER_ROLES } = require("../config/constants");

/**
 * Validate the POST /apply request body.
 */
function validateApplication(req, res, next) {
  const { user_id, type, loan_type, loan_amount, tenure } = req.body;

  const errors = [];

  if (!user_id) errors.push("user_id is required");
  if (!type || !USER_ROLES.includes(type))
    errors.push(`type must be one of: ${USER_ROLES.join(", ")}`);
  if (!loan_type || !LOAN_TYPES.includes(loan_type))
    errors.push(`loan_type must be one of: ${LOAN_TYPES.join(", ")}`);
  if (!loan_amount || loan_amount < 1000)
    errors.push("loan_amount must be at least 1000");
  if (!tenure || tenure < 1 || tenure > 360)
    errors.push("tenure must be between 1 and 360 months");

  // Type-specific validations
  if (type === "individual") {
    const inputs = req.body.individual_inputs || {};
    if (!inputs.income) errors.push("individual_inputs.income is required");
    if (!inputs.cibil_score)
      errors.push("individual_inputs.cibil_score is required");
    if (!inputs.age) errors.push("individual_inputs.age is required");
  }

  if (type === "student") {
    const inputs = req.body.student_inputs || {};
    if (!inputs.guardian_income)
      errors.push("student_inputs.guardian_income is required");
    if (!inputs.student_age)
      errors.push("student_inputs.student_age is required");
  }

  if (type === "organisation") {
    const inputs = req.body.organisation_inputs || {};
    if (inputs.revenue == null)
      errors.push("organisation_inputs.revenue is required");
    if (inputs.debt_to_equity_ratio == null)
      errors.push("organisation_inputs.debt_to_equity_ratio is required");
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

module.exports = { validateApplication };
