const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('MONGO_URI loaded:', process.env.MONGO_URI ? 'Yes' : 'No');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Enhanced static file serving with error handling
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  
  // Check if file exists before serving
  if (fs.existsSync(filePath)) {
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else {
    console.log(`❌ File not found: ${filePath}`);
    res.status(404).json({
      success: false,
      message: 'File not found',
      requestedFile: req.path,
      fullPath: filePath
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/students', require('./routes/students')); // Student routes
app.use('/api/supervisors', require('./routes/supervisors')); // Supervisor routes
app.use('/api/supervision-requests', require('./routes/supervisionRequests')); // Supervision request routes
app.use('/api/supervisor-reports', require('./routes/supervisorReports')); // Supervisor report routes
app.use('/api/test-jobs', require('./routes/testJobs')); // Test routes for debugging

// Add a file check endpoint for debugging
app.get('/debug/files', (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');
  const result = {};
  
  ['cvs', 'certificates', 'profiles'].forEach(dir => {
    const dirPath = path.join(uploadsPath, dir);
    if (fs.existsSync(dirPath)) {
      result[dir] = fs.readdirSync(dirPath);
    } else {
      result[dir] = 'Directory not found';
    }
  });
  
  res.json({
    success: true,
    uploadsPath,
    files: result
  });
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    uploadsPath: path.join(__dirname, 'uploads')
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
