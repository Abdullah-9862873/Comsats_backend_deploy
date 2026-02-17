const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Test route
router.get('/test', auth, async (req, res) => {
  try {
    res.json({ message: 'Completion certificates route working' });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
