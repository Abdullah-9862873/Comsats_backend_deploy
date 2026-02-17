const app = require('../app');

module.exports = async (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
