const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

const connectDB = require('./config/db');

// Connect to database and wait for it
let dbConnection = null;
const initDB = async () => {
  try {
    dbConnection = await connectDB();
    if (dbConnection) {
      console.log('Database connection established');
    } else {
      console.warn('Database connection failed or skipped - MONGO_URI may not be set');
    }
    return dbConnection;
  } catch (err) {
    console.error('Database connection error:', err.message);
    return null;
  }
};

// Initialize DB connection
initDB();

const app = express();

const defaultOrigins = [
  'https://comsats-frontend-deploy.vercel.app',
  'https://comsats-backend-deploy-rjcj.vercel.app',
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

// Apply CORS to ALL requests including errors
app.use(cors({
  origin: originList,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());

// Database connection middleware - ensures DB is connected before handling requests
app.use('/api', async (req, res, next) => {
  const mongoose = require('mongoose');
  
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  // Try to connect if not connected
  try {
    const connectDB = require('./config/db');
    await connectDB();
    
    if (mongoose.connection.readyState === 1) {
      return next();
    } else {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: 'Could not establish MongoDB connection. Please check your MONGO_URI environment variable.',
        mongoUriSet: !!process.env.MONGO_URI,
        readyState: mongoose.connection.readyState
      });
    }
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      error: err.message,
      mongoUriSet: !!process.env.MONGO_URI
    });
  }
});

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
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isServerless: isServerless,
    healthEndpoint: '/health'
  });
});

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      mongoUriSet: !!process.env.MONGO_URI
    }
  });
});

// Helper to safely load routes
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (err) {
    console.error(`❌ Failed to load ${modulePath}:`, err.message);
    return (req, res) => {
      res.status(500).json({
        success: false,
        message: `Route module failed to load: ${modulePath}`,
        error: err.message
      });
    };
  }
};

// Import all routes directly for better Vercel bundling support
const authRoutes = safeRequire('./routes/auth');
const adminRoutes = safeRequire('./routes/adminNew');
const jobsRoutes = safeRequire('./routes/jobs');
const applicationsRoutes = safeRequire('./routes/applications');
const studentsRoutes = safeRequire('./routes/students');
const supervisorsRoutes = safeRequire('./routes/supervisors');
const supervisionRequestsRoutes = safeRequire('./routes/supervisionRequests');
const supervisorReportsRoutes = safeRequire('./routes/supervisorReports');
const notificationsRoutes = safeRequire('./routes/notifications');
const companyProfileRoutes = safeRequire('./routes/companyProfile');
const companiesRoutes = safeRequire('./routes/companies');
const offerLettersRoutes = safeRequire('./routes/offerLetters');
const misconductReportsRoutes = safeRequire('./routes/misconductReports');
const internshipAppraisalsRoutes = safeRequire('./routes/internshipAppraisals');
const progressReportsRoutes = safeRequire('./routes/progressReports');
const joiningReportsRoutes = safeRequire('./routes/joiningReports');
const supervisorChatRoutes = safeRequire('./routes/supervisorChat');
const studentChatRoutes = safeRequire('./routes/studentChat');
const completionCertificatesRoutes = safeRequire('./routes/completionCertificates');
const supervisorEvaluationsRoutes = safeRequire('./routes/supervisorEvaluations');
const finalEvaluationRoutes = safeRequire('./routes/finalEvaluation');
const testDataRoutes = safeRequire('./routes/testData');
const weeklyReportsRoutes = safeRequire('./routes/weeklyReports');
const internshipReportsRoutes = safeRequire('./routes/internshipReports');
const interneeEvaluationsRoutes = safeRequire('./routes/interneeEvaluations');
const testJobsRoutes = safeRequire('./routes/testJobs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/internships', jobsRoutes); // Alias for frontend compatibility
app.use('/api/applications', applicationsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/supervisors', supervisorsRoutes);
app.use('/api/supervision-requests', supervisionRequestsRoutes);
app.use('/api/supervisor-reports', supervisorReportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/offer-letters', offerLettersRoutes);
app.use('/api/misconduct-reports', misconductReportsRoutes);
app.use('/api/internship-appraisals', internshipAppraisalsRoutes);
app.use('/api/progress-reports', progressReportsRoutes);
app.use('/api/joining-reports', joiningReportsRoutes);
app.use('/api/supervisor-chat', supervisorChatRoutes);
app.use('/api/student-chat', studentChatRoutes);
app.use('/api/completion-certificates', completionCertificatesRoutes);
app.use('/api/supervisor-evaluations', supervisorEvaluationsRoutes);
app.use('/api/final-evaluation', finalEvaluationRoutes);
app.use('/api/test-data', testDataRoutes);
app.use('/api/weekly-reports', weeklyReportsRoutes);
app.use('/api/internship-reports', internshipReportsRoutes);
app.use('/api/internee-evaluations', interneeEvaluationsRoutes);
app.use('/api/test-jobs', testJobsRoutes);

app.get('/debug/files', (req, res) => {
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

// Global error handler - must set CORS headers for all error responses
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Ensure CORS headers are set even for errors
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
