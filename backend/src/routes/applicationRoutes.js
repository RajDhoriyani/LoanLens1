const express = require("express");
const {
  applyForLoan,
  getApplications,
  getApplicationById,
  predictLoan,
} = require("../controllers/applicationController");
const { validateApplication } = require("../middleware/validators");

const router = express.Router();

// POST /api/apply — Submit a loan application
router.post("/apply", validateApplication, applyForLoan);

// GET /api/applications — List all applications
router.get("/applications", getApplications);

// GET /api/application/:id — Get single application
router.get("/application/:id", getApplicationById);

// POST /api/predict — Trigger ML prediction
router.post("/predict", predictLoan);

module.exports = router;
