const mongoose = require('mongoose');

// Middleware to check database connection before processing requests
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log(`⚠️  API request to ${req.originalUrl} blocked - Database not connected`);
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please check MongoDB Atlas connection.',
      error: 'DATABASE_DISCONNECTED',
      suggestions: [
        'Check MongoDB Atlas IP whitelist settings',
        'Verify network connection',
        'Check database credentials'
      ]
    });
  }
  next();
};

module.exports = checkDBConnection;