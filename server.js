const emailService = require('./services/emailService');
const app = require('./app');

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    await emailService.verifyConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('✅ Email service initialized');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
