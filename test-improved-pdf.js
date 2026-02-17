// Test the IMPROVED PDF generation with actual data
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Import the updated template
const { UniversalPDFTemplate } = require('./utils/pdfTemplate');

// Test with both good and problematic data
const testCases = [
  {
    name: 'Good Data',
    report: {
      _id: '68be716e210905e2547f7fd9',
      studentName: 'Student_6',
      studentRollNo: 'CIIT/FA21-BSE-123/CII',
      supervisorName: 'Prof. Ahmad',
      weekNumber: 3,
      reportTitle: 'Week 3 Weekly Report',
      tasksCompleted: 'ok sir g',
      challengesFaced: 'ok sir g', 
      reflections: 'ok sir g',
      plansForNextWeek: 'ok sir g',
      supportingMaterials: 'ok sir g',
      companyName: 'TechNoob Solutions',
      companyLocation: 'Islamabad',
      status: 'reviewed',
      dueDate: new Date(),
      submittedAt: new Date()
    }
  },
  {
    name: 'Problematic Data',
    report: {
      _id: '68be6e967392b460146e00d7',
      studentName: 'Student_6',
      studentRollNo: 'CIIT/FA21-BSE-123/CII',
      supervisorName: 'Prof. Ahmad',
      weekNumber: 2,
      reportTitle: 'Week 2 Weekly Report',
      tasksCompleted: 'Join meJoin meJoin meJoin meJoin meJoin me',
      challengesFaced: 'Join meJoin meJoin meJoin meJoin meJoin meJoin me', 
      reflections: '',  // Empty string
      plansForNextWeek: 'undefined',  // Literal string "undefined"
      supportingMaterials: '',  // Empty string
      companyName: 'TechNoob Solutions',
      companyLocation: 'Islamabad',
      status: 'submitted',
      dueDate: new Date(),
      submittedAt: new Date()
    }
  }
];

async function testPDFGeneration() {
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing ${testCase.name}...`);
    console.log('Report data:', {
      tasksCompleted: `"${testCase.report.tasksCompleted}" (${testCase.report.tasksCompleted?.length} chars)`,
      challengesFaced: `"${testCase.report.challengesFaced}" (${testCase.report.challengesFaced?.length} chars)`,
      reflections: `"${testCase.report.reflections}" (${testCase.report.reflections?.length} chars)`,
      plansForNextWeek: `"${testCase.report.plansForNextWeek}" (${testCase.report.plansForNextWeek?.length} chars)`,
      supportingMaterials: `"${testCase.report.supportingMaterials}" (${testCase.report.supportingMaterials?.length} chars)`
    });

    const template = new UniversalPDFTemplate();
    const filename = `test-improved-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    
    // Pipe to file
    template.getDocument().pipe(fs.createWriteStream(filename));
    
    // Build PDF content exactly like the controller does
    template
      .addHeader()
      .addTitle(`Weekly Report - Week ${testCase.report.weekNumber}`)
      .addDetailsSection({
        'Student Name': `${testCase.report.studentName} (${testCase.report.studentRollNo || 'N/A'})`,
        'Supervisor': testCase.report.supervisorName,
        'Company': testCase.report.companyName || 'Not specified',
        'Company Location': testCase.report.companyLocation || 'Not specified',
        'Week Number': `Week ${testCase.report.weekNumber}`,
        'Report Title': testCase.report.reportTitle,
        'Due Date': new Date(testCase.report.dueDate).toLocaleDateString(),
        'Submitted Date': new Date(testCase.report.submittedAt).toLocaleDateString(),
        'Status': testCase.report.status.charAt(0).toUpperCase() + testCase.report.status.slice(1)
      })
      .addContentSection('Tasks Completed', testCase.report.tasksCompleted)
      .addContentSection('Challenges Faced', testCase.report.challengesFaced)
      .addContentSection('Key Learnings', testCase.report.reflections)
      .addContentSection('Plans for Next Week', testCase.report.plansForNextWeek)
      .addContentSection('Additional Comments', testCase.report.supportingMaterials);
    
    template.finalize();
    
    console.log(`✅ Generated ${filename}`);
  }
  
  console.log('\n📄 Test completed! Check the generated PDF files to see the improved formatting.');
}

testPDFGeneration().catch(console.error);
