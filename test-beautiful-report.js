const axios = require('axios');

// Abdullah's JWT token for authentication
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGU1NGQ3NTQ4OWIwYmRkZjNmNDY0ZiIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU5NjgyMjc4LCJleHAiOjE3NjAyODcwNzh9.1CYAGWcr9exrliw75ZgJoiM7KJ05woEcG9vJqu0P5fY';

async function testNewInternshipReportPDF() {
  try {
    console.log('🎨 Testing NEW Beautiful Final Internship Report PDF...');
    console.log('🎯 This should match the completion certificate design!');

    // First, get Abdullah's weekly reports
    const reportsResponse = await axios.get('http://localhost:5005/api/weekly-reports/student/reports', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Weekly reports response:', {
      success: reportsResponse.data.success,
      reportCount: reportsResponse.data.data?.length || 0
    });

    if (reportsResponse.data.success && reportsResponse.data.data?.length > 0) {
      const firstReport = reportsResponse.data.data[0];
      console.log('📋 Found report:', {
        id: firstReport._id,
        weekNumber: firstReport.weekNumber,
        status: firstReport.status
      });

      // Download the PDF with NEW beautiful design
      console.log('🎨 Downloading PDF with BEAUTIFUL NEW DESIGN...');
      
      const pdfResponse = await axios.get(`http://localhost:5005/api/weekly-reports/download-pdf/${firstReport._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'stream'
      });

      // Save the PDF
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'Beautiful_Final_Internship_Report_NEW_DESIGN.pdf');
      
      const writer = fs.createWriteStream(outputPath);
      pdfResponse.data.pipe(writer);

      writer.on('finish', () => {
        console.log('✅ NEW BEAUTIFUL PDF saved successfully:', outputPath);
        console.log('🎨 This PDF should now have the SAME PROFESSIONAL DESIGN as the completion certificate:');
        console.log('   ✨ Decorative borders with corner accents');
        console.log('   ✨ Professional color scheme (Deep Blue, Amber accents)');
        console.log('   ✨ Beautiful headers and section styling');
        console.log('   ✨ Proper margins and structured layout');
        console.log('   ✨ Two-column student/company information');
        console.log('   ✨ Professional section backgrounds');
        console.log('   ✨ COMSATS University branding');
        console.log('   ✨ Formatted, Margined, and Structured design');
        console.log('');
        console.log('🎯 The report should contain:');
        console.log('   📋 Student: Abdullah Student');
        console.log('   📋 Roll Number: SP22-BCS-006');
        console.log('   📋 Company: Tech Pro');
        console.log('   📋 Department: Computer Science');
      });

      writer.on('error', (err) => {
        console.error('❌ Error saving PDF:', err);
      });

    } else {
      console.log('❌ No weekly reports found for Abdullah');
    }

  } catch (error) {
    console.error('❌ Error testing final internship report PDF:', error.response?.data || error.message);
  }
}

testNewInternshipReportPDF();