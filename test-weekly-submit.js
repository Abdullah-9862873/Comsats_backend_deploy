const axios = require('axios');

// Test data - replace with actual values from your system
const testData = {
  eventId: '68be31e3172d569d0fb8127a', // From the error message
  authToken: 'YOUR_JWT_TOKEN_HERE', // Replace with actual student token
  submissionData: {
    tasksCompleted: 'Completed frontend integration for weekly reports',
    challengesFaced: 'Had some issues with field mapping between frontend and backend',
    learningsAchieved: 'Learned about React form handling and API integration',
    plansForNextWeek: 'Plan to work on testing and bug fixes',
    additionalComments: 'Everything went well overall'
  }
};

async function testWeeklyReportSubmission() {
  try {
    console.log('🧪 Testing weekly report submission...');
    
    const response = await axios.post(
      `http://localhost:5003/api/weekly-reports/submit/${testData.eventId}`,
      testData.submissionData,
      {
        headers: {
          'Authorization': `Bearer ${testData.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Only run if token is provided
if (testData.authToken !== 'YOUR_JWT_TOKEN_HERE') {
  testWeeklyReportSubmission();
} else {
  console.log('📝 Please update the authToken in this file with a valid student JWT token to test');
  console.log('You can get the token from browser localStorage or from login response');
}
