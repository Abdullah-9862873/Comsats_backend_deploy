const app = require('./app');

module.exports = (req, res) => app(req, res);

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    externalResolver: true
  }
};
