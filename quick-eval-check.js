// Quick check script for supervisor evaluations
console.log('Starting supervisor evaluation check...');

const checkEvals = async () => {
  try {
    // Use the existing server connection
    const response = await fetch('http://localhost:5005/api/supervisor-reports', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4MzNjMWQxODNiNzJmMDA4NTVkOSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzU3NjEzNDE3LCJleHAiOjE3NTgyMTgyMTd9.I9L53KDh1TubFAoBQS5IHt735mSYEK1LZI7cl7dL3y4'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Supervisor reports response:', data);
    } else {
      console.log('Response status:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

checkEvals();
