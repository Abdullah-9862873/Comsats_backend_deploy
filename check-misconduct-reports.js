const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Checking misconduct reports...');
    
    const reports = await mongoose.connection.db.collection('misconductreports').find({}).sort({ createdAt: -1 }).limit(3).toArray();
    
    console.log('Found reports:', reports.length);
    
    reports.forEach((report, index) => {
      console.log(`\nReport ${index + 1}:`);
      console.log('- _id:', report._id);
      console.log('- studentName:', report.studentName);
      console.log('- companyId:', report.companyId);
      console.log('- companyName:', report.companyName);
      console.log('- supervisorName:', report.supervisorName);
      console.log('- issueType:', report.issueType);
      console.log('- status:', report.status);
      console.log('- createdAt:', report.createdAt);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });