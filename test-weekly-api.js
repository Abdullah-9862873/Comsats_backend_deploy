// Test the weekly reports API directly
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmRjN2IxZjEwYTM2OTIxNGQ0MDE1OSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU3Mjc5ODU3LCJleHAiOjE3NTc4ODQ2NTd9.C2HoCmaqHB2ovhrWDtKsKuSfb_35WYrswHHS0_GSS88';

const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:5003/api/weekly-reports/events/student', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPI();
