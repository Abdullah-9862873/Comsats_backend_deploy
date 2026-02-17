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

const app = express();

const defaultOrigins = [
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

app.use(cors({
  origin: originList,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import all routes directly for better Vercel bundling support
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminNew');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const studentsRoutes = require('./routes/students');
const supervisorsRoutes = require('./routes/supervisors');
const supervisionRequestsRoutes = require('./routes/supervisionRequests');
const supervisorReportsRoutes = require('./routes/supervisorReports');
const notificationsRoutes = require('./routes/notifications');
const companyProfileRoutes = require('./routes/companyProfile');
const companiesRoutes = require('./routes/companies');
const offerLettersRoutes = require('./routes/offerLetters');
const misconductReportsRoutes = require('./routes/misconductReports');
const internshipAppraisalsRoutes = require('./routes/internshipAppraisals');
const progressReportsRoutes = require('./routes/progressReports');
const joiningReportsRoutes = require('./routes/joiningReports');
const supervisorChatRoutes = require('./routes/supervisorChat');
const studentChatRoutes = require('./routes/studentChat');
const completionCertificatesRoutes = require('./routes/completionCertificates');
const supervisorEvaluationsRoutes = require('./routes/supervisorEvaluations');
const finalEvaluationRoutes = require('./routes/finalEvaluation');
const testDataRoutes = require('./routes/testData');
const weeklyReportsRoutes = require('./routes/weeklyReports');
const internshipReportsRoutes = require('./routes/internshipReports');
const interneeEvaluationsRoutes = require('./routes/interneeEvaluations');
const testJobsRoutes = require('./routes/testJobs');

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
