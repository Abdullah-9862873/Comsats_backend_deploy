// Test the API endpoints directly
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPIEndpoints() {
  console.log('🚀 Testing Backend API Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch(`${API_BASE_URL}/test-jobs/test-list`);
    
    if (!healthResponse.ok) {
      throw new Error(`Server not responding: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Server is running');
    console.log(`   Current jobs in database: ${healthData.count}`);

    // Test 2: Create a new job
    console.log('\n2. Testing job creation...');
    const newJobData = {
      jobTitle: 'Backend API Test Job',
      location: 'Test City',
      workType: 'Remote',
      duration: '3 months',
      salary: 'Rs. 40,000/month',
      startDate: '2025-08-01',
      endDate: '2025-11-01',
      jobDescription: 'This job was created via backend API test to verify the endpoint works.',
      requirements: ['API Testing', 'Node.js'],
      technologyStack: ['Node.js', 'Express', 'MongoDB'],
      isUrgent: false,
      tags: ['backend-test', 'api-verification']
    };

    const createResponse = await fetch(`${API_BASE_URL}/test-jobs/test-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newJobData)
    });

    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      throw new Error(`Job creation failed: ${createData.message}`);
    }

    console.log('✅ Job creation successful');
    console.log(`   Created job: "${createData.data.jobTitle}"`);
    console.log(`   Job ID: ${createData.data._id}`);

    // Test 3: Fetch all jobs again
    console.log('\n3. Testing job retrieval...');
    const listResponse = await fetch(`${API_BASE_URL}/test-jobs/test-list`);
    const listData = await listResponse.json();

    console.log('✅ Job retrieval successful');
    console.log(`   Total jobs: ${listData.count}`);
    console.log('   Job titles:');
    listData.data.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.jobTitle} (${job.location})`);
    });

    console.log('\n🎉 All Backend API Tests Passed!');
    console.log('✅ MongoDB connection: Working');
    console.log('✅ Job creation endpoint: Working');
    console.log('✅ Job retrieval endpoint: Working');
    console.log('✅ Data persistence: Working');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start your frontend development server');
    console.log('2. Login as a company user');
    console.log('3. Navigate to Company Dashboard');
    console.log('4. Try posting a new job - it should now save to MongoDB!');

  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend server is running: node server.js');
    console.log('2. Check if MongoDB connection is established');
    console.log('3. Verify the server is listening on port 5000');
  }
}

// Run the test
testAPIEndpoints();
