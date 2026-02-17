const http = require('http');

function testStudentChatAPI() {
  const options = {
    hostname: 'localhost',
    port: 5003,
    path: '/api/student/chat',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4Mjc3MWQxODNiNzJmMDA4NTU4NSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU3MTQwNDc5LCJleHAiOjE3NTc3NDUyNzl9.9r8bpAjknwWyCS-DdU-Gn1ew5t9mw34BzO1ebDuK2I0',
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);
    console.log(`Response Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n📧 CHAT API RESPONSE:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.success && response.chat) {
          const supervisorMessages = response.chat.messages.filter(msg => msg.senderType === 'supervisor');
          console.log(`\n✅ SUCCESS! Found ${supervisorMessages.length} supervisor messages`);
          
          if (supervisorMessages.length > 0) {
            console.log('\n📨 Supervisor Messages:');
            supervisorMessages.forEach((msg, index) => {
              console.log(`${index + 1}. "${msg.message}" (${new Date(msg.timestamp).toLocaleString()})`);
            });
          }
        } else {
          console.log('\n❌ FAILED: No chat data or unsuccessful response');
        }
      } catch (error) {
        console.error('Failed to parse response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

console.log('🧪 Testing Student Chat API...');
testStudentChatAPI();
