// Test script to verify the new hired students API endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5005';

async function testHiredStudentsAPI() {
    try {
        console.log('Testing /api/applications/company/accepted endpoint...\n');
        
        // First, let's get a company token (you'll need to replace with actual company credentials)
        console.log('Note: You will need to test this endpoint through the frontend or with a valid company token.');
        console.log('The endpoint is now available at: GET /api/applications/company/accepted');
        console.log('Required: Authorization header with company JWT token');
        console.log('Expected response: Array of hired students with their details\n');
        
        console.log('Endpoint URL: ' + BASE_URL + '/api/applications/company/accepted');
        console.log('Method: GET');
        console.log('Headers: { Authorization: "Bearer <company_jwt_token>" }');
        console.log('Expected Response Format:');
        console.log(`[
  {
    "_id": "application_id",
    "student": {
      "_id": "student_id",
      "name": "Student Name",
      "email": "student@example.com",
      "rollNumber": "ROLL123"
    },
    "job": {
      "_id": "job_id", 
      "title": "Job Title",
      "designation": "Designation"
    },
    "overallStatus": "approved",
    "appliedAt": "2024-01-01T00:00:00.000Z"
  }
]`);
        
    } catch (error) {
        console.error('Error testing API:', error.message);
    }
}

testHiredStudentsAPI();
