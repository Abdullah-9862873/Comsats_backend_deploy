// Vercel serverless entry point
const fs = require('fs');
const path = require('path');

// Debug: List files to see what's bundled
const debugFiles = () => {
  try {
    const rootDir = path.join(__dirname, '..');
    console.log('Root directory:', rootDir);
    const files = fs.readdirSync(rootDir);
    console.log('Root directory files:', files);
    
    const routesDir = path.join(rootDir, 'routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir);
      console.log('Route files found:', routeFiles);
    } else {
      console.log('Routes directory does not exist at:', routesDir);
    }
  } catch (err) {
    console.error('Debug file listing error:', err);
  }
};

debugFiles();

let app;

try {
  app = require('../app');
  console.log('App loaded successfully');
} catch (error) {
  console.error('Failed to load app:', error);
  
  // Return a fallback handler when app fails to load
  module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
  return;
}

module.exports = async (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Set CORS headers even for errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    externalResolver: true
  }
};
