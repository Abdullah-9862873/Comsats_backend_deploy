const axios = require('axios');

const API_BASE_URL = 'http://localhost:5005/api';

async function testEmailVerificationFlow() {
  console.log('🧪 Testing Email Verification Flow...\n');
  
  try {
    // Test 1: Register a new student
    console.log('1️⃣  Testing Registration with Email Verification...');
    const testEmail = `test.student.${Date.now()}@comsats.edu.pk`;
    const registrationData = {
      name: 'Test Student',
      email: testEmail,
      password: 'testpassword123',
      role: 'student',
      department: 'Computer Science',
      semester: '6',
      regNo: 'SP22-BCS-999'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registrationData);
    console.log('✅ Registration Response:', {
      success: registerResponse.status === 201,
      message: registerResponse.data.message,
      requiresVerification: registerResponse.data.requiresVerification,
      userVerified: registerResponse.data.user?.isVerified
    });

    // Test 2: Try to login without verification
    console.log('\n2️⃣  Testing Login Without Verification...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testEmail,
        password: 'testpassword123'
      });
      console.log('❌ Login should have failed, but succeeded:', loginResponse.data);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        console.log('✅ Login correctly blocked for unverified user:', error.response.data.message);
      } else {
        console.log('❌ Unexpected login error:', error.response?.data || error.message);
      }
    }

    // Test 3: Resend verification email
    console.log('\n3️⃣  Testing Resend Verification Email...');
    const resendResponse = await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
      email: testEmail
    });
    console.log('✅ Resend Response:', {
      success: resendResponse.data.success,
      message: resendResponse.data.message
    });

    // Test 4: Try to resend again quickly (rate limiting test)
    console.log('\n4️⃣  Testing Rate Limiting...');
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
        email: testEmail
      });
      console.log('❌ Rate limiting should have blocked this request');
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('✅ Rate limiting working correctly:', error.response.data.message);
      } else {
        console.log('❌ Unexpected rate limiting error:', error.response?.data || error.message);
      }
    }

    // Test 5: Test invalid verification token
    console.log('\n5️⃣  Testing Invalid Verification Token...');
    try {
      const invalidTokenResponse = await axios.get(`${API_BASE_URL}/auth/verify-email/invalid-token-123`);
      console.log('❌ Invalid token should have failed, but succeeded:', invalidTokenResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid token correctly rejected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected token validation error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Email Verification Flow Test Complete!');
    console.log(`\n📧 To complete the test, check the email sent to: ${testEmail}`);
    console.log('🔗 Click the verification link in the email to verify the account');
    console.log('🔓 Then try logging in with the verified account');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Helper function to test email templates
async function testEmailService() {
  console.log('\n📧 Testing Email Service...');
  
  const EmailService = require('../services/emailService');
  const emailService = new EmailService();
  
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    role: 'student'
  };
  
  const testToken = 'test-verification-token-123';
  
  try {
    // Test verification email
    console.log('📤 Testing verification email...');
    const verificationResult = await emailService.sendVerificationEmail(testUser, testToken);
    console.log('Verification email result:', verificationResult);
    
    // Test welcome email
    console.log('📤 Testing welcome email...');
    const welcomeResult = await emailService.sendWelcomeEmail(testUser);
    console.log('Welcome email result:', welcomeResult);
    
  } catch (error) {
    console.error('Email service test error:', error);
  }
}

// Run tests
if (require.main === module) {
  testEmailVerificationFlow();
}

module.exports = { testEmailVerificationFlow, testEmailService };