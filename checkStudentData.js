const mongoose = require('mongoose');
require('dotenv').config();

const connectAndCheck = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find the student user (from the token we saw in logs: 68c1689a6909d193253ba601)
    const User = require('./models/User');
    const student = await User.findById('68c1689a6909d193253ba601');
    console.log('Student found:', student ? student.name : 'Not found');
    
    // Check if there are any applications for this student
    const Application = require('./models/Application');
    const applications = await Application.find({ studentId: '68c1689a6909d193253ba601' });
    console.log('Applications for this student:', applications.length);
    
    // Check if there are any internship reports for this student
    const InternshipReport = require('./models/InternshipReport');
    const reports = await InternshipReport.find({ studentId: '68c1689a6909d193253ba601' });
    console.log('Internship reports for this student:', reports.length);
    
    // Check completion certificates
    const CompletionCertificate = require('./models/CompletionCertificate');
    const certificates = await CompletionCertificate.find({ studentId: '68c1689a6909d193253ba601' });
    console.log('Completion certificates for this student:', certificates.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectAndCheck();
