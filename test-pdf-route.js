require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

const app = express();

// Simple test route
app.get('/test-pdf/:id', (req, res) => {
  console.log('🔥 TEST PDF ROUTE HIT!');
  console.log('🔥 Report ID:', req.params.id);
  res.json({ success: true, message: 'Test route working', id: req.params.id });
});

// Load the actual internship reports route  
const internshipReportsRouter = require('./routes/internshipReports');
app.use('/api/internship-reports', internshipReportsRouter);

app.listen(3001, () => {
  console.log('🧪 Test server running on port 3001');
  console.log('📍 Test URL: http://localhost:3001/test-pdf/123');
  console.log('📍 Real PDF URL: http://localhost:3001/api/internship-reports/123/pdf');
});
