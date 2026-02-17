// Test the actual API endpoint for hiring a student
const fetch = require('node-fetch');
const fs = require('fs').promises;

async function testHiringAPIEndpoint() {
  console.log('🧪 Testing Company Hiring API Endpoint...\n');

  try {
    // First, let's check if there are any applications we can test with
    console.log('📋 Checking for test applications...');
    
    // Read a simple test configuration (you can modify these values)
    const testConfig = {
      apiUrl: 'http://localhost:5005',
      // You'll need to get these from your actual application data
      applicationId: '60f1b2c3d4e5f6789a0b1c2d', // Replace with actual application ID
      companyToken: 'your-company-jwt-token' // Replace with actual company token
    };

    console.log('ℹ️  NOTE: This test requires:');
    console.log('1. Backend server running on', testConfig.apiUrl);
    console.log('2. Valid application ID');
    console.log('3. Valid company JWT token');
    console.log('4. Application must be in a state where it can be hired');
    
    console.log('\n📡 Testing hiring API call...');
    
    // Test the hiring API endpoint
    const hiringResponse = await fetch(`${testConfig.apiUrl}/api/applications/${testConfig.applicationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testConfig.companyToken}`
      },
      body: JSON.stringify({
        status: 'hired',
        companyComments: 'Excellent performance in the interview. We are excited to have you on our team!'
      })
    });

    if (hiringResponse.ok) {
      const result = await hiringResponse.json();
      console.log('✅ Hiring API call successful!');
      console.log('📧 Check the backend logs for email sending confirmation');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await hiringResponse.text();
      console.log('❌ Hiring API call failed:');
      console.log('Status:', hiringResponse.status);
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: Make sure your backend server is running');
      console.log('   Run: npm start or node server.js in Backend folder');
    }
  }

  console.log('\n📝 To test with real data:');
  console.log('1. Start your backend server');
  console.log('2. Login as a company user to get the JWT token');
  console.log('3. Find an application ID from your database');
  console.log('4. Update this script with real values');
  console.log('5. Run the test again');
  
  console.log('\n🔍 Alternative testing method:');
  console.log('1. Use the company dashboard');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Go to Network tab');
  console.log('4. Hire a student through the UI');
  console.log('5. Check the backend terminal for email logs');
}

// Run the test
testHiringAPIEndpoint();