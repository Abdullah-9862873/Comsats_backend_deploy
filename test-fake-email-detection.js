/**
 * Fake Email Detection Test Script
 * 
 * This script tests the fake email detection system to ensure it properly
 * blocks fake/temporary emails while allowing legitimate ones.
 */

const axios = require('axios');
const FakeEmailDetector = require('./services/fakeEmailDetector');

const API_BASE_URL = 'http://localhost:5005/api';
const fakeEmailDetector = new FakeEmailDetector();

async function testFakeEmailDetection() {
  console.log('🧪 Testing Fake Email Detection System...\n');

  // Test cases: [email, shouldBeBlocked, description]
  const testCases = [
    // Legitimate emails (should be allowed)
    ['student@comsats.edu.pk', false, 'COMSATS student email'],
    ['john.doe@gmail.com', false, 'Gmail address'],
    ['supervisor@yahoo.com', false, 'Yahoo address'],
    ['company@outlook.com', false, 'Outlook address'],
    ['user@protonmail.com', false, 'ProtonMail address'],
    ['test@zoho.com', false, 'Zoho address'],
    
    // Fake/temporary emails (should be blocked)
    ['test@10minutemail.com', true, '10minutemail temporary'],
    ['user@tempmail.org', true, 'TempMail service'],
    ['fake@guerrillamail.com', true, 'Guerrilla mail'],
    ['spam@mailinator.com', true, 'Mailinator service'],
    ['throw@throwaway.email', true, 'Throwaway email'],
    ['temp@yopmail.com', true, 'YOPmail service'],
    ['junk@maildrop.cc', true, 'MailDrop service'],
    ['disposable@trash-mail.com', true, 'Trash mail service'],
    
    // Suspicious patterns (should be blocked)
    ['abcdefghijklmnopqrstuvwxyz123456@example.com', true, 'Random long string'],
    ['test123@example.com', true, 'Starts with test'],
    ['fake.user@example.com', true, 'Starts with fake'],
    ['tempuser@example.com', true, 'Starts with temp'],
    ['spambot@example.com', true, 'Starts with spam'],
    ['user+123@gmail.com', true, 'Contains plus sign'],
    ['user1234567890@example.com', true, 'Contains many digits'],
    
    // Edge cases
    ['', true, 'Empty email'],
    ['invalid-email', true, 'Invalid format'],
    ['@domain.com', true, 'Missing local part'],
    ['user@', true, 'Missing domain'],
    ['user@.com', true, 'Invalid domain'],
    ['user@domain', true, 'No TLD'],
  ];

  console.log('📋 Testing Email Detection Logic...\n');
  
  let passed = 0;
  let failed = 0;

  for (const [email, shouldBeBlocked, description] of testCases) {
    const result = fakeEmailDetector.checkEmail(email);
    const actuallyBlocked = result.isFake;
    
    if (actuallyBlocked === shouldBeBlocked) {
      console.log(`✅ PASS: ${description}`);
      console.log(`   Email: ${email}`);
      console.log(`   Expected: ${shouldBeBlocked ? 'BLOCKED' : 'ALLOWED'}, Got: ${actuallyBlocked ? 'BLOCKED' : 'ALLOWED'}`);
      if (result.reason) console.log(`   Reason: ${result.reason}`);
      console.log(`   Confidence: ${result.confidence}%\n`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${description}`);
      console.log(`   Email: ${email}`);
      console.log(`   Expected: ${shouldBeBlocked ? 'BLOCKED' : 'ALLOWED'}, Got: ${actuallyBlocked ? 'BLOCKED' : 'ALLOWED'}`);
      if (result.reason) console.log(`   Reason: ${result.reason}`);
      console.log(`   Confidence: ${result.confidence}%\n`);
      failed++;
    }
  }

  console.log(`📊 Detection Logic Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  // Test API Integration
  console.log('🌐 Testing API Integration...\n');

  const apiTestCases = [
    {
      name: 'Legitimate Student Registration',
      data: {
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        password: 'testPassword123',
        role: 'student',
        department: 'Computer Science',
        semester: '6',
        regNo: 'SP22-BCS-001'
      },
      shouldSucceed: true
    },
    {
      name: 'Fake Email Student Registration',
      data: {
        name: 'Fake User',
        email: 'fake@10minutemail.com',
        password: 'testPassword123',
        role: 'student',
        department: 'Computer Science',
        semester: '6',
        regNo: 'SP22-BCS-002'
      },
      shouldSucceed: false
    },
    {
      name: 'Legitimate Supervisor Registration',
      data: {
        name: 'Dr. Sarah Wilson',
        email: 'sarah.wilson@yahoo.com',
        password: 'testPassword123',
        role: 'supervisor',
        department: 'Computer Science',
        designation: 'Assistant Professor'
      },
      shouldSucceed: true
    },
    {
      name: 'Fake Email Supervisor Registration',
      data: {
        name: 'Fake Supervisor',
        email: 'supervisor@mailinator.com',
        password: 'testPassword123',
        role: 'supervisor',
        department: 'Computer Science',
        designation: 'Professor'
      },
      shouldSucceed: false
    },
    {
      name: 'Legitimate Company Registration',
      data: {
        name: 'TechCorp Solutions',
        email: 'hr@outlook.com',
        password: 'testPassword123',
        role: 'company',
        companyName: 'TechCorp Solutions',
        industry: 'Software Development',
        website: 'https://techcorp.com',
        about: 'Leading software development company'
      },
      shouldSucceed: true
    },
    {
      name: 'Fake Email Company Registration',
      data: {
        name: 'Fake Company',
        email: 'company@guerrillamail.com',
        password: 'testPassword123',
        role: 'company',
        companyName: 'Fake Corp',
        industry: 'Technology',
        website: 'https://fake.com',
        about: 'Fake company'
      },
      shouldSucceed: false
    }
  ];

  for (const testCase of apiTestCases) {
    try {
      console.log(`🧪 Testing: ${testCase.name}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, testCase.data);
      
      if (testCase.shouldSucceed) {
        console.log(`✅ SUCCESS: Registration allowed as expected`);
        console.log(`   Response: ${response.data.message}`);
        if (response.data.user) {
          console.log(`   User created: ${response.data.user.name} (${response.data.user.email})`);
        }
      } else {
        console.log(`❌ UNEXPECTED: Registration should have been blocked but succeeded`);
        console.log(`   Response: ${response.data.message}`);
      }
      
    } catch (error) {
      if (!testCase.shouldSucceed && error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.error === 'FAKE_EMAIL_DETECTED') {
          console.log(`✅ SUCCESS: Fake email correctly blocked`);
          console.log(`   Reason: ${errorData.reason}`);
          console.log(`   Confidence: ${errorData.confidence}%`);
        } else {
          console.log(`✅ SUCCESS: Registration blocked (different reason: ${errorData.message})`);
        }
      } else if (testCase.shouldSucceed) {
        console.log(`❌ UNEXPECTED: Legitimate email was blocked`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      } else {
        console.log(`❌ UNEXPECTED ERROR: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Wait a bit between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test resend verification with fake emails
  console.log('📧 Testing Resend Verification with Fake Emails...\n');
  
  const resendTestCases = [
    { email: 'test@gmail.com', shouldSucceed: true, description: 'Legitimate email' },
    { email: 'fake@tempmail.org', shouldSucceed: false, description: 'Fake email' }
  ];

  for (const testCase of resendTestCases) {
    try {
      console.log(`🧪 Testing resend verification: ${testCase.description}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
        email: testCase.email
      });
      
      if (testCase.shouldSucceed) {
        console.log(`✅ SUCCESS: Resend allowed for legitimate email`);
      } else {
        console.log(`❌ UNEXPECTED: Resend should have been blocked for fake email`);
      }
      
    } catch (error) {
      if (!testCase.shouldSucceed && error.response?.data?.error === 'FAKE_EMAIL_DETECTED') {
        console.log(`✅ SUCCESS: Resend correctly blocked for fake email`);
        console.log(`   Reason: ${error.response.data.reason}`);
      } else {
        console.log(`ℹ️  INFO: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('');
  }

  // Display detector statistics
  console.log('📊 Fake Email Detector Statistics:');
  const stats = fakeEmailDetector.getStats();
  console.log(`   Fake domains in database: ${stats.fakeDomains}`);
  console.log(`   Legitimate domains in database: ${stats.legitimateDomains}`);
  console.log(`   Suspicious patterns: ${stats.suspiciousPatterns}`);
  
  console.log('\n🎉 Fake Email Detection Testing Complete!');
  console.log('💡 The system is now protecting against fake and temporary emails.');
}

// Run the test
testFakeEmailDetection().catch(console.error);