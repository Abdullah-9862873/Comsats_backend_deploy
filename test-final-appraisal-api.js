const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

async function testAppraisalAPIFinal() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('=== FINAL TEST OF APPRAISAL ELIGIBLE STUDENTS API ===');
    
    // Test the exact same logic as the controller
    const companyUserId = "68ce61622faa3e9026187e8f";
    
    console.log('Testing for company ID:', companyUserId);
    
    // Find all hired applications for this company (same as controller)
    const hiredApplications = await Application.find({
      companyId: companyUserId,
      applicationStatus: 'hired'
    })
    .populate('studentId', 'name email student.regNo')
    .populate('jobId', 'title duration')
    .sort({ updatedAt: -1 });

    console.log('Found hired applications:', hiredApplications.length);

    // Format the response data with null checks (same as updated controller)
    const eligibleStudents = hiredApplications
      .filter(application => application.studentId) // Filter out applications with null studentId
      .map(application => ({
        _id: application.studentId._id,
        name: application.studentId.name,
        email: application.studentId.email,
        internshipTitle: application.jobId?.title || 'N/A',
        duration: application.jobId?.duration || 'N/A',
        applicationId: application._id,
        jobId: application.jobId?._id
      }));

    console.log('Eligible students after filtering:', eligibleStudents.length);

    // Remove duplicates based on student ID (same as controller)
    const uniqueStudents = eligibleStudents.filter((student, index, self) =>
      index === self.findIndex(s => s._id.toString() === student._id.toString())
    );

    console.log('Unique eligible students:', uniqueStudents.length);

    // Log the final result
    console.log('\n✅ FINAL API RESPONSE:');
    console.log(JSON.stringify({
      success: true,
      data: uniqueStudents
    }, null, 2));
    
    console.log('\n🎉 API test completed successfully - no errors!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in API test:', error);
    process.exit(1);
  }
}

testAppraisalAPIFinal();