/**
 * Seed script — creates sample users for quick testing.
 * Run: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const sampleUsers = [
  { name: "Rajesh Kumar", email: "rajesh@example.com", role: "individual" },
  { name: "Priya Sharma", email: "priya@example.com", role: "individual" },
  { name: "Ankit Verma", email: "ankit@example.com", role: "student" },
  { name: "Sneha Patel", email: "sneha@example.com", role: "student" },
  { name: "TechCorp India Pvt Ltd", email: "admin@techcorp.in", role: "organisation" },
  { name: "GreenEnergy Solutions", email: "finance@greenenergy.co", role: "organisation" },
];

async function seed() {
  await connectDB();

  console.log("🌱 Seeding users...");

  for (const userData of sampleUsers) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      await User.create(userData);
      console.log(`  ✅ Created: ${userData.name} (${userData.role})`);
    } else {
      console.log(`  ⏭️  Exists:  ${userData.name}`);
    }
  }

  console.log("\n🎉 Seeding complete!");

  const users = await User.find();
  console.log("\nAll users in database:");
  users.forEach((u) => {
    console.log(`  • ${u._id} | ${u.name} | ${u.email} | ${u.role}`);
  });

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
