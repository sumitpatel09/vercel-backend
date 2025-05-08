const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/session
// @desc    Get current logged in user details
// @access  Private
router.get('/', protect, (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

module.exports = router;
