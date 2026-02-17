// Test the fixed company accepted applications API
const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('Testing Company Accepted Applications API...\n');
        
        // You'll need to replace this with a valid company token
        const companyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4NDNkMWQxODNiNzJmMDA4NTVmMiIsInJvbGUiOiJjb21wYW55IiwiaWF0IjoxNzU3NDkxMzk2LCJleHAiOjE3NTgwOTYxOTZ9.YgzSGmhFC2uTTDGTedL4ytdORhIgcGQJiZesKK8abos';
        
        const response = await fetch('http://localhost:5005/api/applications/company/accepted', {
            headers: {
                'Authorization': `Bearer ${companyToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ API Error:', response.status, response.statusText);
            const errorData = await response.text();
            console.log('Error details:', errorData);
        }
        
    } catch (error) {
        console.error('❌ Request Error:', error.message);
    }
}

testAPI();
