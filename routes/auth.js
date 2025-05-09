const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register user
router.post('/register', async (req, res) => {
  const { username, email, password,role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ username, email, password,role });
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
        role:role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", email); // 🔍 Debug

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("❌ Password did not match for user:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log("✅ Login successful for:", email);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("💥 Server error:", error.message);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
