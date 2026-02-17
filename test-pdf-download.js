const axios = require('axios');
const fs = require('fs');

async function testPDFDownload() {
  try {
    console.log('🔍 Testing PDF download...');
    
    // First, get the reports to find a valid report ID
    const reportsResponse = await axios.get('http://localhost:5005/api/weekly-reports/student/reports', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGU1NGQ3NTQ4OWIwYmRkZjNmNDY0ZiIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU5NjgyMjc4LCJleHAiOjE3NjAyODcwNzh9.1CYAGWcr9exrliw75ZgJoiM7KJ05woEcG9vJqu0P5fY'
      }
    });
    
    console.log('✅ Reports response:', reportsResponse.data?.reports?.length, 'reports found');
    
    if (reportsResponse.data?.reports?.length > 0) {
      const firstReport = reportsResponse.data.reports[0];
      console.log('📄 Testing download for report:', firstReport._id);
      
      // Test the PDF download endpoint
      const pdfResponse = await axios.get(`http://localhost:5005/api/weekly-reports/reports/${firstReport._id}/pdf`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGU1NGQ3NTQ4OWIwYmRkZjNmNDY0ZiIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU5NjgyMjc4LCJleHAiOjE3NjAyODcwNzh9.1CYAGWcr9exrliw75ZgJoiM7KJ05woEcG9vJqu0P5fY'
        },
        responseType: 'arraybuffer'
      });
      
      console.log('✅ PDF Response Status:', pdfResponse.status);
      console.log('✅ PDF Response Headers:', pdfResponse.headers['content-type']);
      console.log('✅ PDF Data Size:', pdfResponse.data.length, 'bytes');
      
      // Save the PDF to verify it's valid
      const fileName = `test_download_${firstReport._id}.pdf`;
      fs.writeFileSync(fileName, pdfResponse.data);
      console.log('✅ PDF saved as:', fileName);
      
    } else {
      console.log('❌ No reports found to test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Status Text:', error.response.statusText);
      console.error('❌ Error data:', error.response.data?.toString?.() || error.response.data);
    } else {
      console.error('❌ Full error:', error);
    }
  }
}

testPDFDownload();