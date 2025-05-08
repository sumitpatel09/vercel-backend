const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get all users (for assigning tasks)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('_id username email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
