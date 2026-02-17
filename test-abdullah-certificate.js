const axios = require('axios');

// Abdullah's JWT token for authentication
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGU1NGQ3NTQ4OWIwYmRkZjNmNDY0ZiIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU5NjgyMjc4LCJleHAiOjE3NjAyODcwNzh9.1CYAGWcr9exrliw75ZgJoiM7KJ05woEcG9vJqu0P5fY';

async function testCompletionCertificate() {
  try {
    console.log('🧪 Testing completion certificate generation...');

    // First, get Abdullah's certificate ID
    const checkResponse = await axios.get('http://localhost:5005/api/completion-certificates/check-eligibility', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Certificate eligibility check response:', checkResponse.data);

    if (checkResponse.data.success && checkResponse.data.existingCertificate) {
      const certificateId = checkResponse.data.existingCertificate._id;
      console.log('📋 Found existing certificate ID:', certificateId);

      // Download the PDF with real offer letter dates
      console.log('🎓 Downloading PDF with real offer letter dates...');
      
      const pdfResponse = await axios.get(`http://localhost:5005/api/completion-certificates/download-pdf/${certificateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'stream'
      });

      // Save the PDF
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'test-completion-certificate-real-dates.pdf');
      
      const writer = fs.createWriteStream(outputPath);
      pdfResponse.data.pipe(writer);

      writer.on('finish', () => {
        console.log('✅ PDF saved successfully:', outputPath);
        console.log('📅 This PDF should now contain:');
        console.log('   - Real Start Date: October 10, 2025');
        console.log('   - Real End Date: January 10, 2026');
        console.log('   - Roll Number: SP22-BCS-006');
        console.log('   - Department: Computer Science');
        console.log('   - Company: Tech Pro');
      });

      writer.on('error', (err) => {
        console.error('❌ Error saving PDF:', err);
      });

    } else {
      console.log('❌ No existing certificate found for Abdullah');
    }

  } catch (error) {
    console.error('❌ Error testing completion certificate:', error.response?.data || error.message);
  }
}

testCompletionCertificate();