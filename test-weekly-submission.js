// Quick test to check weekly report data
const axios = require('axios');

const testWeeklyReportData = async () => {
  try {
    // Get a student token (you'll need to replace this with actual student token)
    const studentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4MjY4MWQxODNiNzJmMDA4NTU4NSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU3MzEzMjc2LCJleHAiOjE3NTc5MTgwNzZ9.abc123'; // Replace with actual token
    
    // Test data structure - what should be sent from frontend
    const testSubmission = {
      tasksCompleted: 'TEST: Completed React integration and API fixes',
      challengesFaced: 'TEST: Had issues with field mapping between frontend and backend',
      learningsAchieved: 'TEST: Learned about MongoDB field mapping and PDF generation',
      plansForNextWeek: 'TEST: Plan to work on supervisor feedback features',
      additionalComments: 'TEST: This is a test submission to verify data flow'
    };
    
    console.log('🧪 Test submission data:', testSubmission);
    console.log('📝 Field lengths:');
    console.log('- tasksCompleted:', testSubmission.tasksCompleted.length, 'chars');
    console.log('- challengesFaced:', testSubmission.challengesFaced.length, 'chars');
    console.log('- learningsAchieved:', testSubmission.learningsAchieved.length, 'chars');
    console.log('- plansForNextWeek:', testSubmission.plansForNextWeek.length, 'chars');
    console.log('- additionalComments:', testSubmission.additionalComments.length, 'chars');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testWeeklyReportData();
