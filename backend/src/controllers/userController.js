const User = require("../models/User");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * POST /api/users
 * Create a new user (open auth — no password required for MVP).
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;

  // Upsert — find or create
  let user = await User.findOne({ email });

  if (user) {
    return res.status(200).json({
      success: true,
      message: "User already exists",
      data: user,
    });
  }

  user = await User.create({ name, email, role });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user,
  });
});

/**
 * GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};

  const users = await User.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  res.json({ success: true, data: user });
});

module.exports = { createUser, getUsers, getUserById };
