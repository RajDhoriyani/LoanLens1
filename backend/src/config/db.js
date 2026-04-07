const mongoose = require("mongoose");

/**
 * Connect to MongoDB with retry logic.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/loanlens";

  try {
    await mongoose.connect(uri);
    console.log(`✅  MongoDB connected → ${mongoose.connection.host}`);
  } catch (err) {
    console.error("❌  MongoDB connection error:", err.message);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB runtime error:", err.message);
  });
}

module.exports = connectDB;
