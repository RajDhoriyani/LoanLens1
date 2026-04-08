import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChevronDown } from "react-icons/hi";
import "./Dropdown.css";

export default function Dropdown({ label, value, options, onChange, name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt.value } });
    setOpen(false);
  };

  return (
    <div className="dropdown" ref={ref}>
      {label && <label className="form-label">{label}</label>}
      <button
        type="button"
        className={`dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="dropdown-value">
          {selected ? selected.label : "Select..."}
        </span>
        <HiOutlineChevronDown className={`dropdown-arrow ${open ? "rotated" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`dropdown-option ${opt.value === value ? "selected" : ""}`}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
