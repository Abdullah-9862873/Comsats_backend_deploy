const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

async function testMisconductReportAPI() {
  try {
    console.log('🧪 Testing Misconduct Report Details API...\n');
    
    const testCompanyId = '68ce61622faa3e9026187e8f';
    const reportId = '68cfa3f9ffaefb5600090382';
    
    // Create a test JWT token
    const testToken = jwt.sign(
      { id: testCompanyId, role: 'company' },
      'abcqwe123rtyh6', // Use the actual JWT secret from .env
      { expiresIn: '1h' }
    );
    
    console.log('📞 Calling API endpoint: /api/misconduct-reports/' + reportId);
    
    const response = await fetch(`http://localhost:5005/api/misconduct-reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 API Response Status:', response.status);
    
    const data = await response.json();
    console.log('📋 API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`\n✅ Report Details:`);
      console.log(`Student: ${data.data.studentName}`);
      console.log(`Company: ${data.data.companyName}`);
      console.log(`Issue: ${data.data.issueType}`);
      console.log(`Status: ${data.data.status}`);
    } else {
      console.log('❌ API returned error or no data');
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testMisconductReportAPI();