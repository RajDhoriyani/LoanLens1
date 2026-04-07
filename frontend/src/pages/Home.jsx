import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineArrowRight,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import "./Home.css";

const features = [
  {
    icon: <HiOutlineLightningBolt />,
    title: "Instant Prediction",
    desc: "Get AI-powered eligibility results in seconds using Random Forest ML models.",
  },
  {
    icon: <HiOutlineChartBar />,
    title: "Detailed Analytics",
    desc: "Visual feature importance charts and personalized improvement suggestions.",
  },
  {
    icon: <HiOutlineShieldCheck />,
    title: "Smart EMI Calculator",
    desc: "Accurate EMI calculation with CIBIL-adjusted interest rates for every loan type.",
  },
  {
    icon: <HiOutlineCurrencyRupee />,
    title: "8 Loan Types",
    desc: "Home, Car, Personal, Medical, Educational, Professional, Gold & LAP.",
  },
];

const userTypes = [
  {
    icon: <HiOutlineUserGroup />,
    title: "Individual",
    desc: "Salaried or self-employed applicants",
    color: "#6366f1",
  },
  {
    icon: <HiOutlineAcademicCap />,
    title: "Student",
    desc: "Education loans with guardian support",
    color: "#06b6d4",
  },
  {
    icon: <HiOutlineOfficeBuilding />,
    title: "Organisation",
    desc: "Business and corporate lending",
    color: "#10b981",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="hero-badge">🤖 Powered by Machine Learning</span>
            <h1 className="hero-title">
              Smart Loan Eligibility
              <br />
              <span className="hero-gradient">Prediction Platform</span>
            </h1>
            <p className="hero-desc">
              Apply for loans with confidence. Our AI engine analyzes your
              financial profile across 18+ features and delivers instant
              eligibility predictions with actionable insights.
            </p>
            <div className="hero-actions">
              <Link to="/apply" className="btn btn-primary btn-lg">
                Apply Now <HiOutlineArrowRight />
              </Link>
              <Link to="/dashboard" className="btn btn-secondary btn-lg">
                View Dashboard
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">3</span>
                <span className="stat-label">ML Models</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-value">18+</span>
                <span className="stat-label">Features Analyzed</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-value">~90%</span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* User Types */}
      <section className="section container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Who Can Apply?</h2>
          <p className="section-subtitle">
            Tailored assessment models for every applicant type
          </p>
        </motion.div>

        <motion.div
          className="user-types-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {userTypes.map((type) => (
            <motion.div key={type.title} className="user-type-card glass-card" variants={item}>
              <div
                className="user-type-icon"
                style={{ background: `${type.color}20`, color: type.color }}
              >
                {type.icon}
              </div>
              <h3>{type.title}</h3>
              <p>{type.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="section container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Why LoanLens?</h2>
          <p className="section-subtitle">
            Advanced ML-driven insights you won&apos;t find elsewhere
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((f) => (
            <motion.div key={f.title} className="feature-card glass-card" variants={item}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="cta-section container">
        <motion.div
          className="cta-card glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>Ready to check your eligibility?</h2>
          <p>Get an instant AI-powered prediction with detailed insights.</p>
          <Link to="/apply" className="btn btn-primary btn-lg">
            Start Application <HiOutlineArrowRight />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
