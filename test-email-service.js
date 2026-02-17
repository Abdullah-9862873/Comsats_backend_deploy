// Test script for email functionality
const emailService = require('./services/emailService');

const testEmailService = async () => {
  console.log('🧪 Testing Email Service...\n');

  // Test 1: Verify connection
  console.log('1️⃣ Testing email connection...');
  const connectionTest = await emailService.verifyConnection();
  if (!connectionTest) {
    console.log('❌ Email connection failed. Exiting...');
    return;
  }

  // Test 2: Test welcome email for student
  console.log('\n2️⃣ Testing student welcome email...');
  try {
    const studentUser = {
      name: 'John Doe',
      email: 'abdullahjaveda47@gmail.com', // Using your email for testing
      role: 'student'
    };
    
    const studentResult = await emailService.sendWelcomeEmail(studentUser);
    console.log('Student email result:', studentResult);
  } catch (error) {
    console.log('❌ Student email error:', error.message);
  }

  // Test 3: Test welcome email for company
  console.log('\n3️⃣ Testing company welcome email...');
  try {
    const companyUser = {
      name: 'TechCorp Ltd',
      email: 'abdullahjaveda47@gmail.com', // Using your email for testing
      role: 'company'
    };
    
    const companyResult = await emailService.sendWelcomeEmail(companyUser);
    console.log('Company email result:', companyResult);
  } catch (error) {
    console.log('❌ Company email error:', error.message);
  }

  // Test 4: Test welcome email for supervisor
  console.log('\n4️⃣ Testing supervisor welcome email...');
  try {
    const supervisorUser = {
      name: 'Dr. Smith',
      email: 'abdullahjaveda47@gmail.com', // Using your email for testing
      role: 'supervisor'
    };
    
    const supervisorResult = await emailService.sendWelcomeEmail(supervisorUser);
    console.log('Supervisor email result:', supervisorResult);
  } catch (error) {
    console.log('❌ Supervisor email error:', error.message);
  }

  // Test 5: Test direct template sending
  console.log('\n5️⃣ Testing direct template sending...');
  try {
    const context = {
      name: 'Test User',
      role: 'student',
      dashboardUrl: 'http://localhost:5173/dashboard/student',
      currentYear: new Date().getFullYear()
    };
    
    const templateResult = await emailService.sendTemplate(
      'abdullahjaveda47@gmail.com',
      'Test Welcome Email',
      'welcome',
      context
    );
    console.log('Template email result:', templateResult);
  } catch (error) {
    console.log('❌ Template email error:', error.message);
  }

  console.log('\n🏁 Email testing completed!');
  console.log('Check your email inbox: abdullahjaveda47@gmail.com');
};

// Run the test
testEmailService().catch(console.error);