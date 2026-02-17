const axios = require('axios');

async function testEvaluationAPI() {
  try {
    console.log('🧪 Testing Evaluation API...');
    
    // First login as supervisor
    const loginResponse = await axios.post('http://localhost:5005/api/auth/login', {
      email: 'test_supervisor@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');
    
    // Now call the hired students API
    const response = await axios.get('http://localhost:5005/api/applications/supervisor/hired-students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response received');
    console.log('Success:', response.data.success);
    console.log('Students count:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📊 Student Details:');
      response.data.data.forEach((student, index) => {
        console.log(`\nStudent ${index + 1}:`);
        console.log('  Name:', student.name);
        console.log('  Email:', student.email);
        console.log('  Department:', student.department);
        console.log('  Position/Job Title:', student.jobTitle);
        console.log('  Company:', student.companyName);
        console.log('  Duration:', student.internshipDuration);
      });
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
  }
}

testEvaluationAPI();
