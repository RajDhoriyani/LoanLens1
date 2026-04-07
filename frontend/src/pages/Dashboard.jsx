import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineEye,
  HiOutlineRefresh,
  HiOutlinePlusCircle,
} from "react-icons/hi";
import { getApplications } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.type = filter;
      const res = await getApplications(params);
      setApplications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status) => {
    const map = {
      approved: "badge-success",
      rejected: "badge-danger",
      submitted: "badge-warning",
      predicted: "badge-info",
      draft: "badge-info",
    };
    return map[status] || "badge-info";
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dashboard-header">
            <div>
              <h1 className="section-title">Dashboard</h1>
              <p className="section-subtitle" style={{ marginBottom: 0 }}>
                Track and manage all loan applications
              </p>
            </div>
            <div className="dashboard-actions">
              <button
                className="btn btn-secondary"
                onClick={fetchApplications}
              >
                <HiOutlineRefresh /> Refresh
              </button>
              <Link to="/apply" className="btn btn-primary">
                <HiOutlinePlusCircle /> New Application
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="filter-bar">
          {["all", "individual", "student", "organisation"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <span>Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No applications found.</p>
            <Link to="/apply" className="btn btn-primary">
              <HiOutlinePlusCircle /> Submit Your First Application
            </Link>
          </div>
        ) : (
          <div className="table-wrapper glass-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>Loan</th>
                  <th>Amount</th>
                  <th>EMI</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <motion.tr
                    key={app._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <td>
                      <div className="applicant-info">
                        <span className="applicant-name">
                          {app.user_id?.name || "—"}
                        </span>
                        <span className="applicant-email">
                          {app.user_id?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="type-tag">{app.type}</span>
                    </td>
                    <td className="capitalize">
                      {app.loan_type?.replace(/_/g, " ")}
                    </td>
                    <td>{formatCurrency(app.loan_amount)}</td>
                    <td>
                      {app.emi ? formatCurrency(app.emi) : "—"}
                      {app.emi && (
                        <span className="emi-sub">/mo</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="date-cell">
                      {formatDate(app.created_at)}
                    </td>
                    <td>
                      <Link
                        to={`/results/${app._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <HiOutlineEye /> View
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
