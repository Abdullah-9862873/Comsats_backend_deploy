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

// Safe route loader with error handling
const loadRoute = (routePath) => {
  try {
    return require(routePath);
  } catch (error) {
    console.error(`❌ Failed to load route ${routePath}:`, error.message);
    return (req, res) => {
      res.status(500).json({
        success: false,
        message: `Route module failed to load`,
        route: routePath,
        error: error.message
      });
    };
  }
};

// Routes
app.use('/api/auth', loadRoute('./routes/auth'));
app.use('/api/admin', loadRoute('./routes/adminNew'));
app.use('/api/jobs', loadRoute('./routes/jobs'));
app.use('/api/applications', loadRoute('./routes/applications'));
app.use('/api/students', loadRoute('./routes/students'));
app.use('/api/supervisors', loadRoute('./routes/supervisors'));
app.use('/api/supervision-requests', loadRoute('./routes/supervisionRequests'));
app.use('/api/supervisor-reports', loadRoute('./routes/supervisorReports'));
app.use('/api/notifications', loadRoute('./routes/notifications'));
app.use('/api/company-profile', loadRoute('./routes/companyProfile'));
app.use('/api/companies', loadRoute('./routes/companies'));
app.use('/api/offer-letters', loadRoute('./routes/offerLetters'));
app.use('/api/misconduct-reports', loadRoute('./routes/misconductReports'));
app.use('/api/internship-appraisals', loadRoute('./routes/internshipAppraisals'));
app.use('/api/progress-reports', loadRoute('./routes/progressReports'));
app.use('/api/joining-reports', loadRoute('./routes/joiningReports'));
app.use('/api/supervisor-chat', loadRoute('./routes/supervisorChat'));
app.use('/api/student-chat', loadRoute('./routes/studentChat'));
app.use('/api/completion-certificates', loadRoute('./routes/completionCertificates'));
app.use('/api/supervisor-evaluations', loadRoute('./routes/supervisorEvaluations'));
app.use('/api/final-evaluation', loadRoute('./routes/finalEvaluation'));
app.use('/api/test-data', loadRoute('./routes/testData'));
app.use('/api/weekly-reports', loadRoute('./routes/weeklyReports'));
app.use('/api/internship-reports', loadRoute('./routes/internshipReports'));
app.use('/api/internee-evaluations', loadRoute('./routes/interneeEvaluations'));
app.use('/api/test-jobs', loadRoute('./routes/testJobs'));

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
