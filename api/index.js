const app = require('../app');

module.exports = async (req, res) => {
  return app(req, res);
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    externalResolver: true
  }
};
