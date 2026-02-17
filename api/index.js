// Vercel serverless entry point
const fs = require('fs');
const path = require('path');

// Debug: List files to see what's bundled
const debugFiles = () => {
  try {
    const rootDir = path.join(__dirname, '..');
    const files = fs.readdirSync(rootDir);
    console.log('Root directory files:', files);
    
    const routesDir = path.join(rootDir, 'routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir);
      console.log('Route files:', routeFiles);
    } else {
      console.log('Routes directory does not exist');
    }
  } catch (err) {
    console.error('Debug file listing error:', err);
  }
};

debugFiles();

let app;

try {
  app = require('../app');
} catch (error) {
  console.error('Failed to load app:', error);
  module.exports = async (req, res) => {
    // Set CORS headers even for error responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: error.message,
      stack: error.stack
    });
  };
  return;
}

module.exports = async (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Set CORS headers even for error responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
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
