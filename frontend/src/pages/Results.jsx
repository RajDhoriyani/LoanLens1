import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLightBulb,
  HiOutlineExclamation,
  HiOutlineArrowLeft,
  HiOutlineCurrencyRupee,
} from "react-icons/hi";
import { getApplicationById, predictLoan } from "../api";
import "./Results.css";

export default function Results() {
  const { id } = useParams();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Try from navigation state first
        if (location.state?.prediction) {
          setPrediction(location.state.prediction);
          const appRes = await getApplicationById(id);
          setApplication(appRes.data.data);
        } else {
          // Load application, run prediction if needed
          const appRes = await getApplicationById(id);
          const app = appRes.data.data;
          setApplication(app);

          if (app.prediction_result?.approval !== undefined) {
            setPrediction({
              approval: app.prediction_result.approval,
              probability_score: app.prediction_result.probability_score,
              feature_importance: app.prediction_result.feature_importance instanceof Map
                ? Object.fromEntries(app.prediction_result.feature_importance)
                : app.prediction_result.feature_importance,
              reasons_for_rejection: app.prediction_result.reasons_for_rejection,
              suggestions: app.prediction_result.suggestions,
              emi_details: {
                emi: app.emi,
              },
            });
          } else {
            // Run prediction
            const predRes = await predictLoan(id);
            setPrediction(predRes.data.data);
            // Reload application
            const updatedApp = await getApplicationById(id);
            setApplication(updatedApp.data.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="loading-container">
            <div className="spinner" />
            <span>Analyzing your application...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!application || !prediction) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state glass-card">
            <p>Application not found.</p>
            <Link to="/dashboard" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = prediction.approval === 1;
  const probability = (prediction.probability_score * 100).toFixed(1);

  // Feature importance chart data (top 10)
  const featureData = prediction.feature_importance
    ? Object.entries(prediction.feature_importance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({
          name: name.replace(/_/g, " "),
          value: parseFloat((value * 100).toFixed(1)),
        }))
    : [];

  const barColors = [
    "#6366f1", "#818cf8", "#06b6d4", "#22d3ee", "#10b981",
    "#34d399", "#f59e0b", "#fbbf24", "#8b5cf6", "#a78bfa",
  ];

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  // Gauge data for probability
  const gaugeData = [
    { name: "Score", value: parseFloat(probability) },
    { name: "Remaining", value: 100 - parseFloat(probability) },
  ];

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="results-page">
          <Link to="/dashboard" className="back-link">
            <HiOutlineArrowLeft /> Back to Dashboard
          </Link>

          {/* Verdict Banner */}
          <motion.div
            className={`verdict-banner glass-card ${
              isApproved ? "approved" : "rejected"
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="verdict-icon">
              {isApproved ? (
                <HiOutlineCheckCircle />
              ) : (
                <HiOutlineXCircle />
              )}
            </div>
            <div className="verdict-content">
              <h1>
                {isApproved ? "Loan Approved!" : "Loan Not Approved"}
              </h1>
              <p>
                {isApproved
                  ? "Congratulations! Your loan application meets the eligibility criteria."
                  : "Your application did not meet the minimum eligibility threshold."}
              </p>
            </div>
            <div className="verdict-score">
              <div className="score-circle">
                <svg viewBox="0 0 100 100" className="score-svg">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={isApproved ? "#10b981" : "#ef4444"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${probability * 2.64} 264`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div className="score-text">
                  <span className="score-value">{probability}%</span>
                  <span className="score-label">Score</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="stats-row">
            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="stat-card-icon" style={{ color: "#6366f1" }}>
                <HiOutlineCurrencyRupee />
              </div>
              <div>
                <span className="stat-card-label">Loan Amount</span>
                <span className="stat-card-value">
                  {formatCurrency(application.loan_amount)}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="stat-card-icon" style={{ color: "#06b6d4" }}>
                <HiOutlineCurrencyRupee />
              </div>
              <div>
                <span className="stat-card-label">Monthly EMI</span>
                <span className="stat-card-value">
                  {application.emi
                    ? formatCurrency(application.emi)
                    : prediction.emi_details?.emi
                    ? formatCurrency(prediction.emi_details.emi)
                    : "—"}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="stat-card-icon" style={{ color: "#10b981" }}>
                <HiOutlineCurrencyRupee />
              </div>
              <div>
                <span className="stat-card-label">Interest Rate</span>
                <span className="stat-card-value">
                  {prediction.emi_details?.interest_rate
                    ? `${prediction.emi_details.interest_rate}%`
                    : "—"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Feature Importance Chart */}
          {featureData.length > 0 && (
            <motion.div
              className="chart-section glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="chart-title">Feature Importance</h2>
              <p className="chart-desc">
                How each factor influenced the prediction decision
              </p>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart
                    data={featureData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${v}%`}
                      stroke="var(--text-muted)"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={180}
                      stroke="var(--text-muted)"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="custom-tooltip">
                              <p className="tooltip-label">
                                {payload[0].payload.name}
                              </p>
                              <p className="tooltip-value">
                                {payload[0].value}% importance
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                      {featureData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={barColors[index % barColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Reasons & Suggestions */}
          <div className="insights-row">
            {prediction.reasons_for_rejection?.length > 0 && (
              <motion.div
                className="insight-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="insight-title danger">
                  <HiOutlineExclamation /> Reasons for Rejection
                </h3>
                <ul className="insight-list">
                  {prediction.reasons_for_rejection.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {prediction.suggestions?.length > 0 && (
              <motion.div
                className="insight-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="insight-title success">
                  <HiOutlineLightBulb /> Suggestions to Improve
                </h3>
                <ul className="insight-list suggestions">
                  {prediction.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Back */}
          <div className="results-footer">
            <Link to="/apply" className="btn btn-primary">
              Apply Again
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              View All Applications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
