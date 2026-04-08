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
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const features = [
  {
    icon: <HiOutlineLightningBolt />,
    title: "Instant Prediction",
    desc: "AI-powered eligibility results in seconds using Random Forest ML models.",
  },
  {
    icon: <HiOutlineChartBar />,
    title: "Detailed Analytics",
    desc: "Visual feature importance charts and personalized improvement suggestions.",
  },
  {
    icon: <HiOutlineShieldCheck />,
    title: "Smart EMI Calculator",
    desc: "Accurate EMI with CIBIL-adjusted interest rates for every loan type.",
  },
  {
    icon: <HiOutlineCurrencyRupee />,
    title: "8 Loan Types",
    desc: "Home, Car, Personal, Medical, Educational, Professional, Gold & LAP.",
  },
];

const userTypes = [
  { icon: <HiOutlineUserGroup />, title: "Individual", desc: "Salaried or self-employed" },
  { icon: <HiOutlineAcademicCap />, title: "Student", desc: "Education loans with guardian support" },
  { icon: <HiOutlineOfficeBuilding />, title: "Organisation", desc: "Business and corporate lending" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page page-wrapper">
      <div className="container">
        {/* Welcome */}
        <motion.div
          className="home-welcome"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="section-title">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>
          <div className="home-buttons">
            <Link to="/apply" className="btn btn-primary btn-lg">
              Apply for a Loan <HiOutlineArrowRight />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              View Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="home-stats">
          {[
            { value: "3", label: "ML Models" },
            { value: "18+", label: "Features Analyzed" },
            { value: "~90%", label: "Accuracy" },
          ].map((s) => (
            <div key={s.label} className="home-stat glass-card">
              <span className="home-stat-value">{s.value}</span>
              <span className="home-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* User Types */}
        <div className="home-section">
          <h2 className="home-section-title">Who Can Apply?</h2>
          <motion.div
            className="user-types-grid"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {userTypes.map((t) => (
              <motion.div key={t.title} className="user-type-card glass-card" variants={item}>
                <div className="user-type-icon">{t.icon}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Features */}
        <div className="home-section">
          <h2 className="home-section-title">Platform Features</h2>
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
        </div>
      </div>
    </div>
  );
}
