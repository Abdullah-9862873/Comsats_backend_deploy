const fetch = require('node-fetch');

async function testFinalResultsEndpoint() {
  try {
    console.log('🔍 Testing /admin/final-results endpoint...');
    
    const response = await fetch('http://localhost:5005/api/admin/final-results', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDhlNzU4MzE3MzJjMzhhOTFiYzA0YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjM0NzM5OCwiZXhwIjoxNzYyOTUyMTk4fQ.oTMWqgYyp7IZXKz5X6zcvMNFdBdvpgh8cRiBmYL2gq4'
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Endpoint is working');
      console.log('📊 Results Count:', data.data?.results?.length || 0);
      console.log('📈 Statistics:', data.data?.statistics);
    } else {
      console.log('❌ ERROR:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testFinalResultsEndpoint();