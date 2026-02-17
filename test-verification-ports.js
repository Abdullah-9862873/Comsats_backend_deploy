const axios = require('axios');

async function testEmailVerificationFlow() {
  console.log('🧪 Testing Email Verification with Correct Port (5005)...\n');

  try {
    // Test 1: Register a user (should trigger verification email)
    console.log('1️⃣ Testing user registration...');
    const testEmail = `test.verification.${Date.now()}@gmail.com`;
    
    const registrationData = {
      name: 'Test User Verification',
      email: testEmail,
      password: 'testPassword123',
      role: 'student',
      department: 'Computer Science',
      semester: '6',
      regNo: `SP22-VER-${Date.now()}`
    };

    const response = await axios.post('http://localhost:5005/api/auth/register', registrationData);
    
    console.log('✅ Registration successful!');
    console.log(`   User: ${response.data.user.name}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log(`   Verified: ${response.data.user.isVerified}`);
    console.log(`   Message: ${response.data.message}`);
    
    // Test 2: Try to login (should be blocked)
    console.log('\n2️⃣ Testing login without verification...');
    
    try {
      const loginResponse = await axios.post('http://localhost:5005/api/auth/login', {
        email: testEmail,
        password: 'testPassword123'
      });
      
      console.log('❌ UNEXPECTED: Login should have been blocked!');
      
    } catch (loginError) {
      if (loginError.response?.status === 403 && loginError.response?.data?.requiresVerification) {
        console.log('✅ Login correctly blocked for unverified user');
        console.log(`   Message: ${loginError.response.data.message}`);
      } else {
        console.log('❌ Unexpected login error:', loginError.response?.data?.message || loginError.message);
      }
    }
    
    // Test 3: Test resend verification
    console.log('\n3️⃣ Testing resend verification...');
    
    try {
      const resendResponse = await axios.post('http://localhost:5005/api/auth/resend-verification', {
        email: testEmail
      });
      
      console.log('✅ Resend verification successful!');
      console.log(`   Message: ${resendResponse.data.message}`);
      
    } catch (resendError) {
      console.log('❌ Resend verification failed:', resendError.response?.data?.message || resendError.message);
    }
    
    console.log('\n📧 Verification Link Information:');
    console.log('   A verification email has been sent to:', testEmail);
    console.log('   Check your email for the verification link');
    console.log('   The link format will be: http://localhost:5173/verify-email/{token}');
    
  } catch (error) {
    if (error.response?.data?.error === 'FAKE_EMAIL_DETECTED') {
      console.log('🚫 Registration blocked due to fake email detection:');
      console.log(`   Reason: ${error.response.data.reason}`);
      console.log(`   Confidence: ${error.response.data.confidence}%`);
    } else {
      console.log('❌ Test failed:', error.response?.data?.message || error.message);
    }
  }
}

testEmailVerificationFlow();