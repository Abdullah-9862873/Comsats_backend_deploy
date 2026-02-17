// Debug the hiring email workflow
const emailService = require('./services/emailService');
require('dotenv').config();

// Mock data that matches what the controller would send
const mockHiringData = {
  student: {
    name: 'Ahmad Hassan',
    email: 'abdullahjaveda47@gmail.com' // Using your test email
  },
  interview: {
    applicationId: '67890abcdef12345',
    scheduledAt: new Date('2025-09-20T10:00:00')
  },
  job: {
    title: 'Full Stack Developer Intern',
    description: 'Develop web applications using React and Node.js',
    location: 'Lahore, Pakistan',
    duration: '3 months',
    stipend: 'PKR 35,000/month'
  },
  company: {
    name: 'TechSolutions Ltd',
    email: 'hr@techsolutions.com'
  },
  offer: {
    _id: '12345abcdef67890',
    startDate: new Date('2025-10-01'),
    duration: '3 months',
    stipend: 'PKR 35,000/month',
    location: 'Lahore Office',
    reportingManager: 'Sarah Ahmed',
    hrContact: 'hr@techsolutions.com'
  }
};

async function debugHiringEmailWorkflow() {
  console.log('🔍 Debugging Hiring Email Workflow...\n');

  try {
    console.log('📧 Testing sendInterviewSuccessEmail method...');
    console.log('Student:', mockHiringData.student.name, '-', mockHiringData.student.email);
    console.log('Company:', mockHiringData.company.name);
    console.log('Job:', mockHiringData.job.title);
    
    // Call the exact same method that the controller calls
    const result = await emailService.sendInterviewSuccessEmail(
      mockHiringData.student,
      mockHiringData.interview,
      mockHiringData.job,
      mockHiringData.company,
      mockHiringData.offer
    );

    if (result.success) {
      console.log('✅ Hiring email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log('\n🎯 The hiring email workflow is working correctly!');
      console.log('\nIf students are not receiving emails when hired through the dashboard:');
      console.log('1. Check if the company is using the correct API endpoint');
      console.log('2. Verify the application status update is calling the right method');
      console.log('3. Check backend logs when hiring happens through the UI');
      console.log('4. Make sure the application has valid student/job/company data');
    } else {
      console.log('❌ Hiring email failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error in hiring email workflow:', error);
  }

  console.log('\n📋 Next debugging steps:');
  console.log('1. Check the company dashboard network requests');
  console.log('2. Verify which API endpoint is being called');
  console.log('3. Check backend terminal logs when hiring through UI');
  console.log('4. Ensure the updateApplicationStatus method is being called');
}

debugHiringEmailWorkflow();