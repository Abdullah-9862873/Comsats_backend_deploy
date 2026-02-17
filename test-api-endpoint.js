const fetch = require('node-fetch');

// Test the updated API endpoint
async function testAPI() {
  try {
    console.log('🧪 Testing Company Applications API...\n');
    
    // Create a dummy token for testing (in real app this would be from login)
    const testCompanyId = '68ce61622faa3e9026187e8f';
    
    // Create a test JWT token
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { id: testCompanyId, role: 'company' },
      'abcqwe123rtyh6', // Use the actual JWT secret from .env
      { expiresIn: '1h' }
    );
    
    console.log('📞 Calling API endpoint: /api/applications/company/pending');
    
    const response = await fetch('http://localhost:5005/api/applications/company/pending', {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📋 API Response Status:', response.status);
    console.log('📋 API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`\n✅ Found ${data.data.length} applications`);
      
      data.data.forEach((app, index) => {
        console.log(`${index + 1}. ${app.studentName}`);
        console.log(`   Status: ${app.applicationStatus}`);
        console.log(`   Offer Status: ${app.offerStatus}`);
        console.log(`   Hiring Date: ${app.hiringDate}`);
        console.log('   ---');
      });
      
      const hiredCount = data.data.filter(app => app.applicationStatus === 'hired').length;
      console.log(`\n🎯 Hired students found: ${hiredCount}`);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPI();