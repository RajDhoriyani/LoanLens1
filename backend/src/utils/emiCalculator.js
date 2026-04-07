/**
 * Calculate EMI (Equated Monthly Installment).
 *
 * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
 *
 * @param {number} principal  - Loan amount (P)
 * @param {number} annualRate - Annual interest rate in percentage (e.g., 10 for 10%)
 * @param {number} tenureMonths - Tenure in months (N)
 * @returns {object} { emi, totalPayment, totalInterest }
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) {
    return { emi: 0, totalPayment: 0, totalInterest: 0 };
  }

  const P = principal;
  const R = annualRate / 12 / 100; // Monthly interest rate
  const N = tenureMonths;

  if (R === 0) {
    // Zero interest edge case
    const emi = P / N;
    return {
      emi: parseFloat(emi.toFixed(2)),
      totalPayment: parseFloat(P.toFixed(2)),
      totalInterest: 0,
    };
  }

  const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
  const totalPayment = emi * N;
  const totalInterest = totalPayment - P;

  return {
    emi: parseFloat(emi.toFixed(2)),
    totalPayment: parseFloat(totalPayment.toFixed(2)),
    totalInterest: parseFloat(totalInterest.toFixed(2)),
  };
}

/**
 * Determine interest rate based on loan type and user profile.
 */
function getInterestRate(loanType, cibilScore = 700) {
  const baseRates = {
    home: 8.5,
    car: 9.5,
    personal: 12.0,
    medical: 11.0,
    educational: 8.0,
    professional: 10.5,
    gold: 7.5,
    loan_against_property: 9.0,
  };

  let rate = baseRates[loanType] || 12.0;

  // Adjust by CIBIL score
  if (cibilScore >= 800) rate -= 1.0;
  else if (cibilScore >= 750) rate -= 0.5;
  else if (cibilScore < 600) rate += 2.0;
  else if (cibilScore < 650) rate += 1.0;

  return Math.max(rate, 5.0); // Floor at 5%
}

module.exports = { calculateEMI, getInterestRate };
