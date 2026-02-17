// Simple API test
const testAPI = async () => {
  try {
    console.log('🧪 Testing API Connection...');
    
    // Test basic server connection
    const response = await fetch('http://localhost:5003/api/jobs');
    console.log('📡 Jobs endpoint status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Jobs endpoint working:', data.success);
    } else {
      console.log('❌ Jobs endpoint error:', response.statusText);
    }
    
    // Test health endpoint if it exists
    try {
      const healthResponse = await fetch('http://localhost:5003/api/health');
      console.log('🏥 Health endpoint status:', healthResponse.status);
    } catch (error) {
      console.log('ℹ️ Health endpoint not available');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testAPI();
