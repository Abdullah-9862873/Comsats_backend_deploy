// Test if server is responding at all
const http = require('http');

const testServerHealth = () => {
  const options = {
    hostname: 'localhost',
    port: 5005,
    path: '/api/admin/stats',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDhlNzU4MzE3MzJjMzhhOTFiYzA0YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjM0NzM5OCwiZXhwIjoxNzYyOTUyMTk4fQ.oTMWqgYyp7IZXKz5X6zcvMNFdBdvpgh8cRiBmYL2gq4',
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is responding! Status: ${res.statusCode}`);
    
    // Now test the final-results endpoint
    setTimeout(() => {
      testFinalResults();
    }, 1000);
  });

  req.on('error', (error) => {
    console.error('❌ Server not responding:', error.message);
  });

  req.end();
};

const testFinalResults = () => {
  const options = {
    hostname: 'localhost',
    port: 5005,
    path: '/api/admin/final-results',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDhlNzU4MzE3MzJjMzhhOTFiYzA0YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjM0NzM5OCwiZXhwIjoxNzYyOTUyMTk4fQ.oTMWqgYyp7IZXKz5X6zcvMNFdBdvpgh8cRiBmYL2gq4',
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Final Results Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Final Results endpoint is working!');
        try {
          const jsonData = JSON.parse(data);
          console.log('📊 Results Count:', jsonData.data?.results?.length || 0);
        } catch (e) {
          console.log('Response:', data.substring(0, 200));
        }
      } else {
        console.log('❌ Error response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Final Results request failed:', error.message);
  });

  req.end();
};

console.log('🔍 Testing server health first...');
testServerHealth();