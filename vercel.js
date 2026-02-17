const app = require('./app');

module.exports = app;
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    externalResolver: true
  }
};
