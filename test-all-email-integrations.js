// Comprehensive test for all email integrations
const emailService = require('./services/emailService');
require('dotenv').config();

async function testAllEmailIntegrations() {
  console.log('🧪 Testing All Email Integrations...\n');
  console.log('=' * 60);

  // Test data
  const testStudent = {
    name: 'Ahmad Hassan',
    email: 'abdullahjaveda47@gmail.com', // Using configured email for testing
    rollNo: 'FA21-BCS-001'
  };

  const testSupervisor = {
    name: 'Dr. Sarah Ahmed',
    email: 'sarah.ahmed@comsats.edu.pk',
    department: 'Computer Science',
    phone: '+92-300-1234567',
    officeLocation: 'Room 301, CS Block'
  };

  const testCompany = {
    name: 'TechVerse Solutions',
    email: 'hr@techverse.com'
  };

  const testJob = {
    title: 'Frontend Developer Intern',
    description: 'Develop modern web applications using React.js and TypeScript',
    location: 'Islamabad, Pakistan',
    duration: '3 months',
    stipend: 'PKR 35,000/month',
    requirements: 'React.js, JavaScript, HTML, CSS'
  };

  let testResults = [];

  // Test 1: Supervisor Acceptance Email
  try {
    console.log('1️⃣ Testing Supervisor Acceptance Email...');
    const result1 = await emailService.sendSupervisorAcceptedEmail(testStudent, testSupervisor);
    
    if (result1.success) {
      console.log('✅ Supervisor acceptance email sent successfully!');
      testResults.push('✅ Supervisor Acceptance: PASS');
    } else {
      console.log('❌ Failed:', result1.error);
      testResults.push('❌ Supervisor Acceptance: FAIL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testResults.push('❌ Supervisor Acceptance: ERROR');
  }

  console.log('\n' + '-'.repeat(50));

  // Test 2: Job Application Approval Email
  try {
    console.log('\n2️⃣ Testing Job Application Approval Email...');
    
    const mockApplication = {
      _id: '60f1b2c3d4e5f6789a0b1c2d',
      appliedAt: new Date(),
      supervisorName: testSupervisor.name
    };

    const result2 = await emailService.sendJobApprovedEmail(testStudent, mockApplication, testJob, testCompany);
    
    if (result2.success) {
      console.log('✅ Job approval email sent successfully!');
      testResults.push('✅ Job Approval: PASS');
    } else {
      console.log('❌ Failed:', result2.error);
      testResults.push('❌ Job Approval: FAIL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testResults.push('❌ Job Approval: ERROR');
  }

  console.log('\n' + '-'.repeat(50));

  // Test 3: Interview Scheduled Email
  try {
    console.log('\n3️⃣ Testing Interview Scheduled Email...');
    
    const mockInterview = {
      _id: '60f1b2c3d4e5f6789a0b1c2e',
      applicationId: '60f1b2c3d4e5f6789a0b1c2d',
      scheduledAt: new Date('2025-09-25T14:00:00'),
      type: 'onsite',
      location: 'TechVerse Office, Blue Area, Islamabad',
      duration: '60 minutes',
      instructions: 'Please bring your portfolio and government ID',
      interviewerName: 'Ahmed Ali',
      interviewerContact: 'ahmed@techverse.com'
    };

    const result3 = await emailService.sendInterviewScheduledEmail(testStudent, mockInterview, testJob, testCompany);
    
    if (result3.success) {
      console.log('✅ Interview scheduled email sent successfully!');
      testResults.push('✅ Interview Scheduled: PASS');
    } else {
      console.log('❌ Failed:', result3.error);
      testResults.push('❌ Interview Scheduled: FAIL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testResults.push('❌ Interview Scheduled: ERROR');
  }

  console.log('\n' + '-'.repeat(50));

  // Test 4: Interview Success (Hired) Email
  try {
    console.log('\n4️⃣ Testing Interview Success Email...');
    
    const mockInterview = {
      applicationId: '60f1b2c3d4e5f6789a0b1c2d',
      scheduledAt: new Date('2025-09-23T14:00:00')
    };

    const mockOffer = {
      _id: '60f1b2c3d4e5f6789a0b1c2f',
      startDate: new Date('2025-10-01'),
      duration: '3 months',
      stipend: 'PKR 35,000/month',
      location: 'Islamabad Office',
      reportingManager: 'Muhammad Hassan',
      hrContact: 'hr@techverse.com'
    };

    const result4 = await emailService.sendInterviewSuccessEmail(testStudent, mockInterview, testJob, testCompany, mockOffer);
    
    if (result4.success) {
      console.log('✅ Interview success email sent successfully!');
      testResults.push('✅ Interview Success: PASS');
    } else {
      console.log('❌ Failed:', result4.error);
      testResults.push('❌ Interview Success: FAIL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testResults.push('❌ Interview Success: ERROR');
  }

  console.log('\n' + '-'.repeat(50));

  // Test 5: Interview Rejection Email
  try {
    console.log('\n5️⃣ Testing Interview Rejection Email...');
    
    const mockInterview = {
      applicationId: '60f1b2c3d4e5f6789a0b1c2d',
      scheduledAt: new Date('2025-09-23T14:00:00')
    };

    const mockFeedback = {
      feedback: 'Strong technical skills but needs improvement in communication. Keep practicing and apply again in the future.',
      strengths: 'excellent problem-solving abilities and technical knowledge',
      recommendedSkills: 'presentation skills and team collaboration'
    };

    const result5 = await emailService.sendInterviewRejectionEmail(testStudent, mockInterview, testJob, testCompany, mockFeedback);
    
    if (result5.success) {
      console.log('✅ Interview rejection email sent successfully!');
      testResults.push('✅ Interview Rejection: PASS');
    } else {
      console.log('❌ Failed:', result5.error);
      testResults.push('❌ Interview Rejection: FAIL');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    testResults.push('❌ Interview Rejection: ERROR');
  }

  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('🎯 EMAIL INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  
  testResults.forEach(result => {
    console.log(result);
  });

  const passCount = testResults.filter(r => r.includes('PASS')).length;
  const totalTests = testResults.length;

  console.log('\n📊 Summary:');
  console.log(`✅ Passed: ${passCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passCount}/${totalTests}`);

  if (passCount === totalTests) {
    console.log('\n🎉 ALL EMAIL INTEGRATIONS ARE WORKING PERFECTLY!');
    console.log('Students will receive emails for:');
    console.log('• Supervisor acceptance of supervision requests');
    console.log('• Supervisor approval of job applications');
    console.log('• Company interview scheduling');
    console.log('• Interview results (hired/rejected)');
  } else {
    console.log('\n⚠️  Some email integrations need attention.');
    console.log('Check the error messages above for details.');
  }

  console.log('\n✉️  Check your email inbox for the test emails!');
}

// Run all tests
testAllEmailIntegrations();