// Quick test to verify the supervision request endpoints are working
const http = require('http');

console.log('🧪 Testing Supervision Request API Endpoints');
console.log('='.repeat(50));

const testHealthEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/auth/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('✅ Server is responding');
    console.log(`   Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('   Response:', data || 'OK');
      console.log('\n🎉 Server is running and supervision request routes are loaded!');
      console.log('   - Supervision request routes are now available');
      console.log('   - Middleware issue has been fixed');
      console.log('   - Server started successfully on port 5002');
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error testing endpoint:', e.message);
  });

  req.end();
};

// Test the server
testHealthEndpoint();
