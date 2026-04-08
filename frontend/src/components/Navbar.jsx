import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const navLinks = [
  { path: "/home", label: "Home", icon: <HiOutlineHome /> },
  { path: "/apply", label: "Apply", icon: <HiOutlinePlusCircle /> },
  { path: "/dashboard", label: "Dashboard", icon: <HiOutlineDocumentText /> },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/home" className="navbar-logo">
          <span className="logo-text">LoanLens</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                location.pathname === link.path ? "active" : ""
              }`}
            >
              {link.icon}
              {link.label}
              {location.pathname === link.path && (
                <motion.div
                  className="nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {user && (
            <div className="navbar-user">
              <span className="user-name">{user.name}</span>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <HiOutlineLogout />
              </button>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-link ${
                  location.pathname === link.path ? "active" : ""
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <button className="mobile-link mobile-logout" onClick={handleLogout}>
              <HiOutlineLogout /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
