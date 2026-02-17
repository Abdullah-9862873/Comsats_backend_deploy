// Test PDF generation with problematic data (undefined values)
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Mock the problematic report data we found (Report 2)
const mockReport = {
  _id: '68be6e967392b460146e00d7',
  studentName: 'Student_6',
  studentRollNo: 'CIIT/FA21-BSE-123/CII',
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
  submissionDate: new Date(),
  dueDate: new Date()
};

class UniversalPDFTemplate {
  constructor(doc) {
    this.doc = doc;
    this.margin = 50;
    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
  }

  addHeader(title, subtitle) {
    // COMSATS Header
    this.doc.fillColor('#2c3e50')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('COMSATS University Islamabad', this.margin, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.currentY += 25;
    
    this.doc.fontSize(14)
           .fillColor('#34495e')
           .text('Department of Computer Science', this.margin, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.currentY += 30;
    
    // Document Title
    this.doc.fillColor('#2c3e50')
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(title, this.margin, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.currentY += 20;
    
    if (subtitle) {
      this.doc.fontSize(12)
             .fillColor('#7f8c8d')
             .font('Helvetica')
             .text(subtitle, this.margin, this.currentY, {
               width: this.contentWidth,
               align: 'center'
             });
      this.currentY += 15;
    }

    // Header line
    this.doc.strokeColor('#3498db')
           .lineWidth(2)
           .moveTo(this.margin, this.currentY)
           .lineTo(this.pageWidth - this.margin, this.currentY)
           .stroke();

    this.currentY += 25;
    return this;
  }

  addDetailsSection(details) {
    const leftWidth = this.contentWidth * 0.3;
    const rightWidth = this.contentWidth * 0.65;
    const separatorX = this.margin + leftWidth + 10;

    for (const [key, value] of Object.entries(details)) {
      const startY = this.currentY;
      
      // Left side - label
      this.doc.fillColor('#2c3e50')
             .fontSize(11)
             .font('Helvetica-Bold')
             .text(key, this.margin, this.currentY, {
               width: leftWidth,
               align: 'left'
             });

      // Right side - value  
      this.doc.fillColor('#34495e')
             .fontSize(11)
             .font('Helvetica')
             .text(value || 'Not specified', separatorX + 10, this.currentY, {
               width: rightWidth,
               align: 'left'
             });

      // Calculate height used
      const heightUsed = Math.max(
        this.doc.heightOfString(key, { width: leftWidth }),
        this.doc.heightOfString(value || 'Not specified', { width: rightWidth })
      );

      // Draw vertical separator line
      this.doc.strokeColor('#bdc3c7')
             .lineWidth(1)
             .moveTo(separatorX, startY)
             .lineTo(separatorX, startY + heightUsed)
             .stroke();

      this.currentY += heightUsed + 8;
    }

    this.currentY += 10;
    return this;
  }

  addSectionHeader(title) {
    this.doc.fillColor('#2c3e50')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text(title, this.margin, this.currentY);
    
    this.currentY += 20;
    return this;
  }

  addContent(text) {
    // Enhanced logic to handle problematic values
    console.log(`📝 Processing content: "${text}" (type: ${typeof text}, length: ${text?.length})`);
    
    if (!text || text === 'undefined' || text.trim() === '' || text === null) {
      text = 'Not specified';
      console.log(`   ➜ Converted to: "${text}"`);
    }
    
    this.doc.fillColor('#34495e')
           .fontSize(11)
           .font('Helvetica')
           .text(text, this.margin, this.currentY, {
             width: this.contentWidth,
             align: 'left'
           });
    
    const textHeight = this.doc.heightOfString(text, { width: this.contentWidth });
    this.currentY += textHeight + 15;
    return this;
  }
}

console.log('🔍 Testing PDF generation with PROBLEMATIC data...');
console.log('Report data:', {
  tasksCompleted: `"${mockReport.tasksCompleted}" (${mockReport.tasksCompleted?.length} chars)`,
  challengesFaced: `"${mockReport.challengesFaced}" (${mockReport.challengesFaced?.length} chars)`,
  reflections: `"${mockReport.reflections}" (${mockReport.reflections?.length} chars)`,
  plansForNextWeek: `"${mockReport.plansForNextWeek}" (${mockReport.plansForNextWeek?.length} chars)`,
  supportingMaterials: `"${mockReport.supportingMaterials}" (${mockReport.supportingMaterials?.length} chars)`
});

const doc = new PDFDocument({ margin: 50 });
const template = new UniversalPDFTemplate(doc);

// Generate the PDF with problematic data
template.addHeader(
  `Weekly Report - Week ${mockReport.weekNumber}`,
  `Submitted by ${mockReport.studentName}`
);

template.addDetailsSection({
  'Student Name': mockReport.studentName,
  'Roll Number': mockReport.studentRollNo,
  'Week Number': mockReport.weekNumber.toString(),
  'Company': mockReport.companyName,
  'Location': mockReport.companyLocation,
  'Status': mockReport.status,
  'Submission Date': mockReport.submissionDate?.toLocaleDateString() || 'N/A'
});

template.addSectionHeader('Tasks Completed');
template.addContent(mockReport.tasksCompleted);

template.addSectionHeader('Challenges Faced');
template.addContent(mockReport.challengesFaced);

template.addSectionHeader('Learning Reflections');
template.addContent(mockReport.reflections);

template.addSectionHeader('Plans for Next Week');
template.addContent(mockReport.plansForNextWeek);

template.addSectionHeader('Supporting Materials');
template.addContent(mockReport.supportingMaterials);

// Save the PDF
doc.pipe(fs.createWriteStream('test-weekly-report-problematic.pdf'));
doc.end();

console.log('✅ Problematic test PDF generated as test-weekly-report-problematic.pdf');
console.log('📄 This shows how the PDF handles empty/undefined values');
