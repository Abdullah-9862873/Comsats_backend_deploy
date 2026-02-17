const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load environment variables for both local and serverless environments
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

console.log('MONGO_URI loaded:', process.env.MONGO_URI ? 'Yes' : 'No');

const isServerless = Boolean(process.env.VERCEL);

if (!isServerless) {
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.log('🔄 Attempting graceful shutdown...');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('🔄 Attempting graceful shutdown...');
    process.exit(1);
  });

  const monitorMemory = () => {
    const used = process.memoryUsage();
    const memoryMB = Math.round(used.heapUsed / 1024 / 1024);

    if (memoryMB > 200) {
      console.warn(`⚠️  High memory usage: ${memoryMB}MB`);

      if (memoryMB > 500 && global.gc) {
        global.gc();
        console.log('🗑️  Forced garbage collection');
      }
    }
  };

  setInterval(monitorMemory, 30000);
}

const app = express();

// Lazy database connection - only connect when needed
let dbConnected = false;
const ensureDB = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error.message);
    }
  }
};

// Only auto-connect in non-serverless environments
if (!isServerless) {
  connectDB().catch((error) => {
    console.error('❌ Initial MongoDB connection attempt failed:', error.message);
  });
}

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const originList = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use(cors({
  origin: originList,
  credentials: true
}));

app.use(express.json());

// Serve static assets
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/uploads', (req, res, next) => {
  const decodedPath = decodeURIComponent(req.path);
  const filePath = path.join(__dirname, 'uploads', decodedPath);

  if (fs.existsSync(filePath)) {
    req.url = decodedPath;
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else {
    console.log(`❌ File not found: ${req.path}`);
    console.log(`❌ Decoded path: ${decodedPath}`);
    console.log(`❌ Full path: ${filePath}`);
    res.status(404).json({
      success: false,
      message: 'File not found',
      requestedFile: req.path,
      decodedPath,
      fullPath: filePath
    });
  }
});

// Default root + health check endpoints shared by local and serverless deployments
app.get('/', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      message: 'Backend is running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      healthEndpoint: '/health'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Middleware to ensure DB connection for routes that need it
const ensureDbConnection = async (req, res, next) => {
  await ensureDB();
  next();
};

// Routes
app.use('/api/auth', ensureDbConnection, require('./routes/auth'));
app.use('/api/admin', ensureDbConnection, require('./routes/adminNew'));
app.use('/api/jobs', ensureDbConnection, require('./routes/jobs'));
app.use('/api/applications', ensureDbConnection, require('./routes/applications'));
app.use('/api/students', ensureDbConnection, require('./routes/students'));
app.use('/api/supervisors', ensureDbConnection, require('./routes/supervisors'));
app.use('/api/supervision-requests', ensureDbConnection, require('./routes/supervisionRequests'));
app.use('/api/supervisor-reports', ensureDbConnection, require('./routes/supervisorReports'));
app.use('/api/notifications', ensureDbConnection, require('./routes/notifications'));
app.use('/api/company-profile', ensureDbConnection, require('./routes/companyProfile'));
app.use('/api/companies', ensureDbConnection, require('./routes/companies'));
app.use('/api/offer-letters', ensureDbConnection, require('./routes/offerLetters'));
app.use('/api/misconduct-reports', ensureDbConnection, require('./routes/misconductReports'));
app.use('/api/internship-appraisals', ensureDbConnection, require('./routes/internshipAppraisals'));
app.use('/api/progress-reports', ensureDbConnection, require('./routes/progressReports'));
app.use('/api/joining-reports', ensureDbConnection, require('./routes/joiningReports'));
app.use('/api/supervisor-chat', ensureDbConnection, require('./routes/supervisorChat'));
app.use('/api/student-chat', ensureDbConnection, require('./routes/studentChat'));
app.use('/api/completion-certificates', ensureDbConnection, require('./routes/completionCertificates'));
app.use('/api/supervisor-evaluations', ensureDbConnection, require('./routes/supervisorEvaluations'));
app.use('/api/final-evaluation', ensureDbConnection, require('./routes/finalEvaluation'));
app.use('/api/test-data', ensureDbConnection, require('./routes/testData'));

// Weekly reports debugging middleware + routes
app.use('/api/weekly-reports', ensureDbConnection, (req, res, next) => {
  console.log(`📍 WEEKLY REPORTS DEBUG: ${req.method} ${req.path}`);
  console.log(`📋 Headers:`, req.headers.authorization ? 'Auth header present' : 'No auth header');
  next();
});

app.use('/api/weekly-reports', ensureDbConnection, require('./routes/weeklyReports'));
app.use('/api/internship-reports', ensureDbConnection, require('./routes/internshipReports'));
app.use('/api/internee-evaluations', ensureDbConnection, require('./routes/interneeEvaluations'));
app.use('/api/test-jobs', ensureDbConnection, require('./routes/testJobs'));

app.get('/debug/files', ensureDbConnection, (req, res) => {
  const uploadsPath = path.join(__dirname, 'uploads');
  const result = {};

  ['cvs', 'certificates', 'profiles'].forEach((dir) => {
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
