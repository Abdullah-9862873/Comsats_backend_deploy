const mongoose = require('mongoose');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');
const Student = require('./models/Student');

mongoose.connect('mongodb://localhost:27017/FYP_Project')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check companies
    const companies = await User.find({ role: 'company' });
    console.log(`\n=== Companies (${companies.length}) ===`);
    for (let company of companies) {
      const profile = await CompanyProfile.findOne({ user: company._id });
      console.log(`- ${company.email} (ID: ${company._id})`);
      if (profile) {
        console.log(`  Profile: ${profile.companyName}`);
      } else {
        console.log(`  Profile: No profile found`);
      }
    }
    
    // Check students
    const students = await Student.find({});
    console.log(`\n=== Students (${students.length}) ===`);
    students.slice(0, 5).forEach(student => {
      console.log(`- ${student.name} (${student.rollNo}) - ID: ${student._id}`);
    });
    
    if (students.length > 5) {
      console.log(`  ... and ${students.length - 5} more students`);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });