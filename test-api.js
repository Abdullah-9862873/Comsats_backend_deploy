const fetch = require('node-fetch');

const testAPI = async () => {
  try {
    const supervisorToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4MzNjMWQxODNiNzJmMDA4NTVkOSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzU3NTc0Mzk4LCJleHAiOjE3NTgxNzkxOTh9.SF_LDtu6A0Cz7ASDGRg2_R_rtLTYjDYusYVApGMaDcc';
    
    console.log('🧪 Testing /api/applications/supervisor/hired-students endpoint');
    
    const response = await fetch('http://localhost:5005/api/applications/supervisor/hired-students', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supervisorToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.applications) {
      console.log('\n📊 Hired Students Summary:');
      console.log('Total hired students:', data.applications.length);
      
      data.applications.forEach((student, index) => {
        console.log(`\n${index + 1}. ${student.studentId.name}`);
        console.log(`   Registration: ${student.studentId.registrationNumber}`);
        console.log(`   Company: ${student.jobId?.companyId?.name || 'N/A'}`);
        console.log(`   Position: ${student.position}`);
        console.log(`   Duration: ${student.duration}`);
        console.log(`   Start Date: ${student.startDate || 'N/A'}`);
        console.log(`   End Date: ${student.endDate || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testAPI();
