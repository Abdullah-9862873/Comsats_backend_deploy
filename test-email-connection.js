// Test email service connection and basic functionality
const emailService = require('./services/emailService');
require('dotenv').config();

async function testEmailService() {
  console.log('🧪 Testing Email Service Connection...\n');

  try {
    // Test email service connection
    const isConnected = await emailService.verifyConnection();
    
    if (!isConnected) {
      console.log('❌ Email service connection failed!');
      console.log('Please check your email configuration in .env file:');
      console.log('- EMAIL_USER (Gmail address)');
      console.log('- EMAIL_PASS (App password)');
      return;
    }

    console.log('✅ Email service connection successful!\n');

    // Test sending a simple notification
    console.log('📧 Testing simple notification email...');
    
    const testUser = {
      name: 'Test Student',
      email: 'abdullahjaveda47@gmail.com', // Using the configured email for testing
      role: 'student'
    };

    const result = await emailService.sendNotificationEmail(
      testUser,
      '🧪 Test Email - Application Workflow Integration',
      'This is a test email to verify that the email integration is working correctly. The system can now send notifications for:\n\n• Supervisor approval of applications\n• Interview scheduling by companies\n• Interview results (hired/rejected)\n\nIf you received this email, the integration is working properly!',
      'normal'
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log('\nYou should receive the test email shortly.');
      console.log('Check your inbox (and spam folder) for the test email.');
    } else {
      console.log('❌ Test email failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error testing email service:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🎯 Email service test completed!');
  console.log('\nNext steps:');
  console.log('1. Check your email inbox for the test email');
  console.log('2. If successful, emails will now be sent automatically when:');
  console.log('   • Supervisors approve job applications');
  console.log('   • Companies schedule interviews');
  console.log('   • Companies hire or reject students');
  console.log('3. Monitor the backend logs for email sending confirmations');
}

// Run the test
testEmailService();