const axios = require('axios');

async function testCompaniesAPI() {
  try {
    console.log('Testing companies API...');
    
    // Test without authentication first
    try {
      const response = await axios.get('http://localhost:5002/api/companies');
      console.log('✅ API Response without auth:', response.data);
    } catch (error) {
      console.log('❌ Error without auth:', error.response?.data || error.message);
      
      // If auth is required, let's try with a dummy token
      try {
        const authResponse = await axios.get('http://localhost:5002/api/companies', {
          headers: { Authorization: 'Bearer dummy-token' }
        });
        console.log('✅ API Response with dummy auth:', authResponse.data);
      } catch (authError) {
        console.log('❌ Error with dummy auth:', authError.response?.data || authError.message);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompaniesAPI();
