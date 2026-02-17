const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

async function testMisconductAPI() {
  try {
    console.log('🧪 Testing Misconduct Reports Eligible Students API...\n');
    
    const testCompanyId = '68ce61622faa3e9026187e8f';
    
    // Create a test JWT token
    const testToken = jwt.sign(
      { id: testCompanyId, role: 'company' },
      'abcqwe123rtyh6', // Use the actual JWT secret from .env
      { expiresIn: '1h' }
    );
    
    console.log('📞 Calling API endpoint: /api/misconduct-reports/eligible-students/' + testCompanyId);
    
    const response = await fetch(`http://localhost:5005/api/misconduct-reports/eligible-students/${testCompanyId}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 API Response Status:', response.status);
    
    const data = await response.json();
    console.log('📋 API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`\n✅ Found ${data.data.length} eligible students for misconduct reporting`);
      
      data.data.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.rollNumber})`);
        console.log(`   Email: ${student.email}`);
        console.log(`   Job: ${student.jobTitle}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ API returned error or no data');
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testMisconductAPI();