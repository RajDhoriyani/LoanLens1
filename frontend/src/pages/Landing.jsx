import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createUser } from "../api";
import { useAuth } from "../context/AuthContext";
import Dropdown from "../components/Dropdown";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState(null); // null | "signin" | "getstarted"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "individual",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        mode === "signin"
          ? { name: formData.email.split("@")[0], email: formData.email, role: "individual" }
          : formData;

      const res = await createUser(payload);
      login(res.data.data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setMode(null);
    setError("");
  };

  return (
    <div className="landing-page">
      {/* Minimal background */}
      <div className="landing-bg">
        <div className="landing-line landing-line-1" />
        <div className="landing-line landing-line-2" />
        <div className="landing-line landing-line-3" />
      </div>

      <div className="landing-center">
        {/* Logo / Project Name */}
        <motion.h1
          className="landing-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          LoanLens
        </motion.h1>

        {/* Action Area */}
        {mode === null ? (
          <motion.div
            className="landing-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <button
              className="landing-btn landing-btn-primary"
              onClick={() => setMode("getstarted")}
            >
              Get Started
            </button>
            <button
              className="landing-btn landing-btn-ghost"
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
          </motion.div>
        ) : (
          <motion.form
            className="landing-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {mode === "getstarted" && (
              <div className="landing-field">
                <input
                  type="text"
                  className="landing-input"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="landing-field">
              <input
                type="email"
                className="landing-input"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                required
                autoFocus={mode === "signin"}
              />
            </div>

            {mode === "getstarted" && (
              <div className="landing-field">
                <Dropdown
                  name="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, role: e.target.value }))
                  }
                  options={[
                    { value: "individual", label: "Individual" },
                    { value: "student", label: "Student" },
                    { value: "organisation", label: "Organisation" },
                  ]}
                />
              </div>
            )}

            {error && <p className="landing-error">{error}</p>}

            <div className="landing-form-actions">
              <button
                type="submit"
                className="landing-btn landing-btn-primary"
                disabled={loading}
              >
                {loading
                  ? "..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </button>
              <button
                type="button"
                className="landing-btn landing-btn-ghost"
                onClick={goBack}
              >
                Back
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
