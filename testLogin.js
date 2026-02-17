const http = require('http');
const querystring = require('querystring');

// Function to make HTTP requests
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🔐 Logging in with test student...');
    
    // Login to get token
    const loginData = JSON.stringify({
      email: 'student.test@example.com',
      password: 'password123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('🔐 Login response:', loginResponse);
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
      
      // Now test companies API
      console.log('📋 Testing companies API with token...');
      
      const companiesOptions = {
        hostname: 'localhost',
        port: 5002,
        path: '/api/companies',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const companiesResponse = await makeRequest(companiesOptions);
      console.log('📋 Companies API response:', companiesResponse);
      
      if (companiesResponse.status === 200) {
        console.log('✅ Companies loaded successfully!');
        console.log('📊 Companies count:', companiesResponse.data.data?.companies?.length || 0);
      } else {
        console.log('❌ Companies API failed:', companiesResponse);
      }
    } else {
      console.log('❌ Login failed:', loginResponse);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
