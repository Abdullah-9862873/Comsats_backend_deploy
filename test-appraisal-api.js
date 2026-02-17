const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

async function testAppraisalAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('=== TESTING APPRAISAL ELIGIBLE STUDENTS API LOGIC ===');
    
    // Simulate the same logic as the controller
    const companyUserId = new mongoose.Types.ObjectId("68c59a40412425622976d182"); // Use one of the company IDs from our data
    
    console.log('Testing for company ID:', companyUserId);
    
    // Find all hired applications for this company
    const hiredApplications = await Application.find({
      companyId: companyUserId,
      applicationStatus: 'hired'
    })
    .populate('studentId', 'name email student.regNo')
    .populate('jobId', 'title duration')
    .sort({ updatedAt: -1 });

    console.log('Found hired applications:', hiredApplications.length);

    // Format the response data - this is where the error was occurring
    const eligibleStudents = hiredApplications.map(application => {
      console.log('Processing application:', application._id);
      console.log('  Student ID populated:', application.studentId ? 'Yes' : 'No');
      console.log('  Job ID populated:', application.jobId ? 'Yes' : 'No');
      
      if (!application.studentId) {
        console.log('  ❌ ERROR: studentId is null - this would cause the error!');
        return null;
      }
      
      return {
        _id: application.studentId._id,
        name: application.studentId.name,
        email: application.studentId.email,
        internshipTitle: application.jobId?.title || 'N/A',
        duration: application.jobId?.duration || 'N/A',
        applicationId: application._id,
        jobId: application.jobId?._id
      };
    }).filter(student => student !== null); // Remove any null entries

    console.log('Eligible students processed:', eligibleStudents.length);
    
    eligibleStudents.forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log('  Name:', student.name);
      console.log('  Email:', student.email);
      console.log('  Internship:', student.internshipTitle);
      console.log('  Duration:', student.duration);
    });

    // Remove duplicates based on student ID
    const uniqueStudents = eligibleStudents.filter((student, index, self) =>
      index === self.findIndex(s => s._id.toString() === student._id.toString())
    );

    console.log('Unique eligible students:', uniqueStudents.length);
    
    console.log('✅ API logic test completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in API logic test:', error);
    process.exit(1);
  }
}

testAppraisalAPI();