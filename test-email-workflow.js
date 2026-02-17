// Test email notifications for application workflow
const emailService = require('./services/emailService');
require('dotenv').config();

async function testEmailNotifications() {
  console.log('🧪 Testing Email Notification System...\n');

  // Test data
  const testStudent = {
    name: 'Ahmad Ali',
    email: 'ahmad.ali@student.comsats.edu.pk'
  };

  const testCompany = {
    name: 'TechNoob Solutions',
    email: 'hr@technoob.com'
  };

  const testJob = {
    title: 'Software Engineer Intern',
    description: 'Develop web applications using React and Node.js',
    location: 'Lahore, Pakistan',
    duration: '3 months',
    stipend: 'PKR 30,000/month'
  };

  // Test 1: Interview Scheduled Email
  try {
    console.log('📅 Testing Interview Scheduled Email...');
    
    const interview = {
      _id: '675e123456789abcdef12345',
      applicationId: '675e123456789abcdef12345',
      scheduledAt: new Date('2025-09-25T10:00:00'),
      type: 'onsite',
      location: 'TechNoob Office, Main Boulevard, Lahore',
      duration: '45 minutes',
      instructions: 'Please bring your CV and portfolio. Ask for HR at reception.',
      interviewerName: 'Sarah Ahmed',
      interviewerContact: 'sarah@technoob.com'
    };

    const result1 = await emailService.sendInterviewScheduledEmail(testStudent, interview, testJob, testCompany);
    
    if (result1.success) {
      console.log('✅ Interview scheduled email sent successfully!');
    } else {
      console.log('❌ Failed to send interview scheduled email:', result1.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing interview scheduled email:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Interview Success (Hired) Email
  try {
    console.log('🎉 Testing Interview Success Email...');
    
    const interview = {
      applicationId: '675e123456789abcdef12345',
      scheduledAt: new Date('2025-09-23T10:00:00')
    };

    const offer = {
      _id: '675e123456789abcdef54321',
      startDate: new Date('2025-10-01'),
      duration: '3 months',
      stipend: 'PKR 30,000/month',
      location: 'Lahore Office',
      reportingManager: 'Ahmed Hassan',
      hrContact: 'hr@technoob.com'
    };

    const result2 = await emailService.sendInterviewSuccessEmail(testStudent, interview, testJob, testCompany, offer);
    
    if (result2.success) {
      console.log('✅ Interview success email sent successfully!');
    } else {
      console.log('❌ Failed to send interview success email:', result2.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing interview success email:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Interview Rejection Email
  try {
    console.log('📧 Testing Interview Rejection Email...');
    
    const interview = {
      applicationId: '675e123456789abcdef12345',
      scheduledAt: new Date('2025-09-23T10:00:00')
    };

    const feedback = {
      feedback: 'Good technical knowledge but needs improvement in communication skills',
      strengths: 'strong problem-solving abilities and technical aptitude',
      recommendedSkills: 'communication skills and teamwork experience'
    };

    const result3 = await emailService.sendInterviewRejectionEmail(testStudent, interview, testJob, testCompany, feedback);
    
    if (result3.success) {
      console.log('✅ Interview rejection email sent successfully!');
    } else {
      console.log('❌ Failed to send interview rejection email:', result3.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing interview rejection email:', error.message);
  }

  console.log('\n🎯 Email notification tests completed!');
}

// Run the tests
testEmailNotifications();