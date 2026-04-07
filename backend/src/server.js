require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

// Route imports
const userRoutes = require("./routes/userRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ─── Middleware ─── */
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* ─── Health Check ─── */
app.get("/", (req, res) => {
  res.json({
    service: "LoanLens Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ─── API Routes ─── */
app.use("/api/users", userRoutes);
app.use("/api", applicationRoutes);

/* ─── 404 Handler ─── */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

/* ─── Error Handler ─── */
app.use(errorHandler);

/* ─── Start Server ─── */
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🏦  LoanLens Backend API              ║
║   📡  http://localhost:${PORT}             ║
║   🌍  Environment: ${process.env.NODE_ENV || "development"}      ║
╚══════════════════════════════════════════╝
    `);
  });
}

startServer();

module.exports = app;
