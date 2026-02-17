const mongoose = require('mongoose');
const InternshipReport = require('./models/InternshipReport');
const dotenv = require('dotenv');

dotenv.config();

const clearInternshipReports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    const result = await InternshipReport.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} internship reports.`);

  } catch (error) {
    console.error('Error clearing internship reports:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

clearInternshipReports();
