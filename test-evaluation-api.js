const https = require('https');
const http = require('http');

async function testEvaluationAPI() {
    try {
        console.log('Testing hired students API endpoint...\n');
        
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4MzNjMWQxODNiNzJmMDA4NTVkOSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzU3NTc0Mzk4LCJleHAiOjE3NTgxNzkxOTh9.SF_LDtu6A0Cz7ASDGRg2_R_rtLTYjDYusYVApGMaDcc';
        
        const options = {
            hostname: 'localhost',
            port: 5005,
            path: '/api/applications/supervisor/hired-students',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                });
            });
            
            req.on('error', (err) => {
                reject(err);
            });
            
            req.end();
        });
        
        console.log('✅ API Response Status:', response.status);
        console.log('📊 Number of hired students:', response.data?.length || 0);
        
        if (response.data && response.data.length > 0) {
            console.log('\n=== FIRST STUDENT DETAILS ===');
            const firstStudent = response.data[0];
            console.log('Name:', firstStudent.name);
            console.log('Email:', firstStudent.email);
            console.log('Registration:', firstStudent.registrationNumber);
            console.log('Company:', firstStudent.companyName);
            console.log('Internship Duration:', firstStudent.internshipDuration);
            console.log('Start Date:', firstStudent.internshipStartDate);
            console.log('End Date:', firstStudent.internshipEndDate);
            
            console.log('\n=== ALL STUDENTS SUMMARY ===');
            response.data.forEach((student, index) => {
                console.log(`${index + 1}. ${student.name} - Duration: ${student.internshipDuration}`);
            });
        } else {
            console.log('No data returned or empty array');
            if (response.data) {
                console.log('Response data:', JSON.stringify(response.data, null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.error('Full error:', error);
    }
}

testEvaluationAPI();
