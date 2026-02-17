// Vercel serverless entry point
let app;

try {
  app = require('../app');
} catch (error) {
  console.error('Failed to load app:', error);
  module.exports = async (req, res) => {
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
