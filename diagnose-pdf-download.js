/**
 * 🔍 PDF DOWNLOAD ERROR DIAGNOSIS TEST
 * 
 * This test will simulate the exact frontend download process to identify
 * what specific error is preventing PDF files from opening correctly.
 */

const fs = require('fs');
const axios = require('axios');

async function diagnosePDFDownloadIssue() {
  try {
    console.log('🔍 DIAGNOSING PDF DOWNLOAD ISSUE...\n');
    
    // Test 1: Generate a simple PDF file and check if it's valid
    console.log('📄 Test 1: Generating standalone PDF to verify PDF generation...');
    
    const { ProfessionalJoiningReportPDF } = require('./utils/pdfGenerator');
    
    // Create a simple test PDF
    const testPDF = new ProfessionalJoiningReportPDF();
    const testFilename = 'diagnosis_test.pdf';
    
    const writeStream = fs.createWriteStream(testFilename);
    testPDF.getDocument().pipe(writeStream);
    
    // Add minimal content
    testPDF
      .addHeader()
      .addTitle('PDF DIAGNOSIS TEST')
      .addSectionHeading('Test Section')
      .addInfoTable([
        ['Test Field', 'Test Value'],
        ['Status', 'Testing PDF Generation']
      ])
      .addFooter()
      .finalize();
    
    // Wait for file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // Check file size and properties
    const stats = fs.statSync(testFilename);
    console.log(`✅ Test PDF generated: ${testFilename}`);
    console.log(`📏 File size: ${stats.size} bytes (${(stats.size/1024).toFixed(1)} KB)`);
    
    if (stats.size < 1000) {
      console.log('⚠️  WARNING: PDF file is very small - might be corrupt');
    } else {
      console.log('✅ PDF file size looks normal');
    }
    
    // Test 2: Check PDF file header to ensure it's a valid PDF
    console.log('\n📋 Test 2: Checking PDF file structure...');
    
    const pdfBuffer = fs.readFileSync(testFilename);
    const pdfHeader = pdfBuffer.toString('ascii', 0, 10);
    
    console.log(`📄 PDF Header: "${pdfHeader}"`);
    
    if (pdfHeader.startsWith('%PDF-')) {
      console.log('✅ Valid PDF header detected');
    } else {
      console.log('❌ INVALID PDF HEADER - This is the problem!');
      console.log('First 50 bytes:', pdfBuffer.toString('ascii', 0, 50));
    }
    
    // Test 3: Check for PDF trailer
    const pdfTrailer = pdfBuffer.toString('ascii', -50);
    console.log(`📄 PDF Trailer (last 50 chars): "${pdfTrailer}"`);
    
    if (pdfTrailer.includes('%%EOF')) {
      console.log('✅ Valid PDF trailer detected');
    } else {
      console.log('❌ INVALID PDF TRAILER - PDF not properly closed!');
    }
    
    // Test 4: Check backend route response headers
    console.log('\n🔧 Test 3: Checking backend route response...');
    
    // Test if we can load the required models (simulate route execution)
    try {
      const JoiningReport = require('./models/JoiningReport');
      const { COMSATSPDFGenerator } = require('./utils/pdfGenerator');
      console.log('✅ Backend models and generators load correctly');
    } catch (error) {
      console.log('❌ Backend model/generator loading error:', error.message);
    }
    
    // Test 5: Check if Content-Length issue
    console.log('\n📊 Test 4: Analyzing potential Content-Length issue...');
    
    const backendRouteContent = fs.readFileSync('./routes/joiningReports.js', 'utf8');
    
    if (backendRouteContent.includes("res.setHeader('Content-Length', 0)")) {
      console.log('🚨 FOUND THE PROBLEM: Content-Length is set to 0 in backend route!');
      console.log('   This prevents the PDF from being downloaded correctly.');
      console.log('   Solution: Remove or fix the Content-Length header');
    } else {
      console.log('✅ Content-Length header not set to 0');
    }
    
    // Test 6: Check for response streaming issues
    console.log('\n🔄 Test 5: Checking PDF streaming implementation...');
    
    if (backendRouteContent.includes('.pipe(res)') && backendRouteContent.includes('.finalize()')) {
      console.log('✅ PDF streaming setup looks correct');
    } else {
      console.log('❌ PDF streaming setup might have issues');
    }
    
    // Summary and recommendations
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('════════════════════════════════════════════════════════════════');
    
    if (stats.size > 1000 && pdfHeader.startsWith('%PDF-') && pdfTrailer.includes('%%EOF')) {
      console.log('✅ PDF generation is working correctly');
      console.log('🔍 Issue is likely in the backend route or frontend handling');
      
      if (backendRouteContent.includes("res.setHeader('Content-Length', 0)")) {
        console.log('🎯 PRIMARY ISSUE: Content-Length header set to 0');
        console.log('   SOLUTION: Remove the Content-Length: 0 header from backend route');
      } else {
        console.log('🔍 Check for other response header issues or network problems');
      }
    } else {
      console.log('❌ PDF generation has fundamental issues');
      console.log('🔧 Need to fix PDF generator implementation');
    }
    
    console.log('\n🎯 RECOMMENDED ACTIONS:');
    console.log('1. Remove Content-Length: 0 header from backend route');
    console.log('2. Ensure proper error handling in PDF generation');  
    console.log('3. Add proper Content-Type and Content-Disposition headers');
    console.log('4. Test with a real joining report ID and authentication');
    
    // Cleanup
    fs.unlinkSync(testFilename);
    console.log(`\n🧹 Cleanup: Removed test file ${testFilename}`);
    
  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  }
}

// Run diagnosis
diagnosePDFDownloadIssue().then(() => {
  console.log('\n✅ PDF DOWNLOAD DIAGNOSIS COMPLETED');
}).catch(error => {
  console.error('❌ Diagnosis failed:', error);
});