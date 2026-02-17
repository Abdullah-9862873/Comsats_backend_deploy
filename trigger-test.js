console.log('Testing final-results endpoint...');

// Try refreshing the Results page in the browser now
// The server should show error logs when you access the Results tab

// If you want to test from here, uncomment the code below:
/*
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/api/admin/final-results',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDhlNzU4MzE3MzJjMzhhOTFiYzA0YSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjM0NzM5OCwiZXhwIjoxNzYyOTUyMTk4fQ.oTMWqgYyp7IZXKz5X6zcvMNFdBdvpgh8cRiBmYL2gq4'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
*/