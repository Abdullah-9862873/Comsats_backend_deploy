const axios = require('axios');

async function testCompanyEvaluations() {
  try {
    console.log('Testing company evaluations API endpoint...\n');
    
    // Test with a sample token (you might need to adjust this)
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJhODEzZjFkMTgzYjcyZjAwODU1NDgiLCJyb2xlIjoic3VwZXJ2aXNvciIsImlhdCI6MTczNjUwMDczOSwiZXhwIjoxNzM2NTg3MTM5fQ.J7zHAqQ5P1LWJxO_ZpnYRDowGPqbZe6D0aNKa-s6E24';
    
    const response = await axios.get('http://localhost:5005/api/internee-evaluations/supervisor/evaluations', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Number of company evaluations:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📝 Sample evaluation data:');
      console.log(JSON.stringify(response.data.data[0], null, 2));
    } else {
      console.log('No company evaluations found');
    }
    
    console.log('\nFull response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing company evaluations API:', error.response?.data || error.message);
  }
}

testCompanyEvaluations();
