const axios = require('axios');

async function testStudentResultAPIFixed() {
  try {
    console.log('🧪 Testing student result API with company name fix...');
    
    // First login as the actual student
    const loginResponse = await axios.post('http://localhost:5005/api/auth/login', {
      email: 'abdullahjaveda47@gmail.com',
      password: 'password123' // Default password for test users
    });
    
    console.log('✅ Login successful!');
    const token = loginResponse.data.token;
    
    // Now call the student result endpoint
    const resultResponse = await axios.get('http://localhost:5005/api/final-evaluation/student/result', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📊 Student Result Response:');
    console.log('Success:', resultResponse.data.success);
    
    if (resultResponse.data.data) {
      console.log('\n📋 Student Info:');
      console.log('- Name:', resultResponse.data.data.studentInfo.name);
      console.log('- Roll Number:', resultResponse.data.data.studentInfo.rollNumber);
      console.log('- Department:', resultResponse.data.data.studentInfo.department);
      console.log('- Email:', resultResponse.data.data.studentInfo.email);
      
      console.log('\n💼 Internship Info:');
      console.log('- Company:', resultResponse.data.data.internshipInfo.companyName);
      console.log('- Position:', resultResponse.data.data.internshipInfo.position);
      console.log('- Supervisor:', resultResponse.data.data.internshipInfo.supervisorName);
      
      console.log('\n📈 Evaluation:');
      console.log('- Supervisor Marks:', resultResponse.data.data.evaluation.supervisorMarks);
      console.log('- Company Marks:', resultResponse.data.data.evaluation.companyMarks);
      console.log('- Total Marks:', resultResponse.data.data.evaluation.totalMarks);
      console.log('- Grade:', resultResponse.data.data.evaluation.grade);
      console.log('- Is Submitted:', resultResponse.data.data.evaluation.isSubmitted);
      
      // Check if company name is fixed
      const companyName = resultResponse.data.data.internshipInfo.companyName;
      if (companyName === 'Unknown Company') {
        console.log('\n❌ ISSUE: Company name is still showing as "Unknown Company"');
      } else {
        console.log(`\n✅ SUCCESS: Company name is correctly showing as "${companyName}"`);
      }
    } else {
      console.log('No data returned:', resultResponse.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testStudentResultAPIFixed();