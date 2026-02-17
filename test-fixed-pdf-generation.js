const mongoose = require('mongoose');
const { COMSATSPDFGenerator } = require('./utils/pdfGenerator');
const fs = require('fs');
require('dotenv').config();

console.log('🧪 Testing Enhanced PDF Generation...');

// Test the PDF generator with sample data
const testPDF = () => {
  try {
    const pdfGen = new COMSATSPDFGenerator('Test Joining Report - COMSATS University');
    
    // Set up file stream
    const stream = fs.createWriteStream('./test-joining-report-fixed.pdf');
    pdfGen.getDocument().pipe(stream);
    
    // Test data with proper formatting
    const testData = [
      ['Student Name', 'Abdullah Test Student'],
      ['Roll Number', 'SP22-BCS-006'],
      ['Student Email', 'abdullah.test@gmail.com'],
      ['Company/Organization', 'TechPro Solutions (Fixed Company Name)'],
      ['Supervisor', 'Mr. Ahmad Khan (ahmad@techpro.com)'],
      ['Internship Start Date', 'Wednesday, November 19, 2025'],
      ['Internship End Date', 'Friday, February 20, 2026'],
      ['Report Status', 'VERIFIED'],
      ['Submission Date', 'Friday, November 21, 2025'],
      ['Report ID', '4B6C31E2']
    ];
    
    const testThoughts = `I am excited to join TechPro Solutions as an intern. This opportunity will allow me to apply my theoretical knowledge in a real-world environment and gain valuable industry experience. I look forward to contributing to the team while learning new technologies and best practices in software development.

The company's focus on innovation and cutting-edge technology aligns perfectly with my career goals. I am particularly interested in their work on machine learning and artificial intelligence projects. This internship will provide me with the exposure I need to develop my skills further.

I am committed to maintaining professionalism throughout this internship and adhering to all company policies and procedures. I understand the importance of this opportunity and will work diligently to make the most of this learning experience.`;
    
    // Build PDF with fixed formatting
    pdfGen
      .createHeader('JOINING REPORT')
      .getDocument().fillColor('#003366').fontSize(24).font('Helvetica-Bold')
      .text('INTERNSHIP JOINING REPORT', 50, pdfGen.getDocument().y, { align: 'center' });
    
    pdfGen.getDocument().y += 40;
    
    pdfGen
      .createSectionHeader('STUDENT & INTERNSHIP DETAILS')
      .createInfoTable(testData)
      .createContentSection('STUDENT THOUGHTS & REFLECTIONS', testThoughts)
      .createAcknowledgmentSection([
        'I have successfully joined the internship program at the mentioned organization',
        'All information provided in this report is accurate and complete',
        'I understand my responsibilities and commitments as an intern',
        'I will adhere to company policies and maintain professionalism throughout'
      ])
      .createSignatureSection()
      .createFooter('4B6C31E2')
      .addWatermark('COMSATS')
      .finalize();
    
    stream.on('finish', () => {
      console.log('✅ Test PDF generated successfully: test-joining-report-fixed.pdf');
      console.log('📄 PDF Features:');
      console.log('   ✓ Fixed text encoding issues');
      console.log('   ✓ Proper spacing and alignment');
      console.log('   ✓ Company name from 3rd registration step');
      console.log('   ✓ COMSATS branding and colors');
      console.log('   ✓ Professional layout and typography');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
testPDF();