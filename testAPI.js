// Simple test script to test job creation API
const testJobAPI = async () => {
  const baseURL = 'http://localhost:5000/api';

  console.log('🚀 Testing Job Creation API...\n');

  try {
    // Test 1: Create a job using the test endpoint (no auth required)
    console.log('Test 1: Creating job via test endpoint...');
    const testResponse = await fetch(`${baseURL}/test-jobs/test-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobTitle: 'API Test Job',
        location: 'Remote',
        workType: 'Remote',
        duration: '3 months',
        salary: 'Rs. 35,000/month',
        startDate: '2025-08-15',
        endDate: '2025-11-15',
        jobDescription: 'This job was created via API test',
        requirements: ['Test skill 1', 'Test skill 2'],
        technologyStack: ['React', 'Node.js'],
        isUrgent: true,
        tags: ['api-test', 'automation']
      })
    });

    const testResult = await testResponse.json();
    console.log('✅ Test endpoint result:', testResult.success ? 'SUCCESS' : 'FAILED');
    if (testResult.success) {
      console.log('   Job ID:', testResult.data._id);
      console.log('   Job Title:', testResult.data.jobTitle);
    } else {
      console.log('   Error:', testResult.message);
    }

    // Test 2: List all jobs
    console.log('\nTest 2: Fetching all jobs...');
    const listResponse = await fetch(`${baseURL}/test-jobs/test-list`);
    const listResult = await listResponse.json();
    
    console.log('✅ List jobs result:', listResult.success ? 'SUCCESS' : 'FAILED');
    console.log('   Total jobs in database:', listResult.count);
    
    if (listResult.data && listResult.data.length > 0) {
      console.log('   Recent jobs:');
      listResult.data.slice(0, 3).forEach(job => {
        console.log(`   - ${job.jobTitle} (${job.location}) - ${job.status}`);
      });
    }

    // Test 3: Try to create job with missing data (should fail)
    console.log('\nTest 3: Testing validation (should fail)...');
    const invalidResponse = await fetch(`${baseURL}/test-jobs/test-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobTitle: 'Incomplete Job',
        // Missing required fields
      })
    });

    const invalidResult = await invalidResponse.json();
    console.log('✅ Validation test result:', !invalidResult.success ? 'SUCCESS (properly rejected)' : 'FAILED');
    if (!invalidResult.success) {
      console.log('   Error message:', invalidResult.message);
    }

    console.log('\n🎉 API Testing Complete!');
    console.log('\nℹ️  Check your MongoDB Atlas dashboard to see the jobs that were created.');
    console.log('   You should now see documents in the fyp_internship_system.jobs collection.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testJobAPI();

// Export for use in browser console or other scripts
if (typeof window !== 'undefined') {
  window.testJobAPI = testJobAPI;
}
