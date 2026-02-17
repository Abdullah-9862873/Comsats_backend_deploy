const PDFDocument = require('pdfkit');

class FinalResultsPDF {
  constructor() {
    this.doc = null;
    this.pageWidth = 0;
    this.pageHeight = 0;
    this.margins = { top: 60, bottom: 60, left: 60, right: 60 };
    this.colors = {
      primary: '#003366',      // COMSATS Navy Blue
      secondary: '#00509E',    // COMSATS Blue
      accent: '#f59e0b',       // Amber
      text: '#1f2937',         // Dark gray
      textLight: '#6b7280',    // Light gray
      success: '#059669',      // Green
      border: '#e5e7eb',       // Light border
      background: '#f8fafc'    // Very light background
    };
    this.currentY = 0;
  }

  createDocument() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: this.margins,
      info: {
        Title: 'Final Internship Results',
        Subject: 'Official Final Internship Evaluation Results',
        Keywords: 'internship, results, evaluation, final, COMSATS'
      }
    });

    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
    this.currentY = this.margins.top;

    return this.doc;
  }

  // Add decorative border to the page
  addPageBorder() {
    const borderMargin = 20;
    const x = borderMargin;
    const y = borderMargin;
    const width = this.pageWidth - (borderMargin * 2);
    const height = this.pageHeight - (borderMargin * 2);

    // Outer border - thick COMSATS blue
    this.doc.strokeColor(this.colors.primary)
           .lineWidth(3)
           .rect(x, y, width, height)
           .stroke();

    // Inner border - thin
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .rect(x + 10, y + 10, width - 20, height - 20)
           .stroke();

    // Corner decorations
    this.addCornerDecorations(x, y, width, height);
  }

  addCornerDecorations(x, y, width, height) {
    const cornerSize = 30;
    
    // Top-left corner
    this.doc.strokeColor(this.colors.accent)
           .lineWidth(2)
           .moveTo(x + 15, y + 15 + cornerSize)
           .lineTo(x + 15, y + 15)
           .lineTo(x + 15 + cornerSize, y + 15)
           .stroke();

    // Top-right corner
    this.doc.strokeColor(this.colors.accent)
           .lineWidth(2)
           .moveTo(x + width - 15 - cornerSize, y + 15)
           .lineTo(x + width - 15, y + 15)
           .lineTo(x + width - 15, y + 15 + cornerSize)
           .stroke();

    // Bottom-left corner
    this.doc.strokeColor(this.colors.accent)
           .lineWidth(2)
           .moveTo(x + 15, y + height - 15 - cornerSize)
           .lineTo(x + 15, y + height - 15)
           .lineTo(x + 15 + cornerSize, y + height - 15)
           .stroke();

    // Bottom-right corner
    this.doc.strokeColor(this.colors.accent)
           .lineWidth(2)
           .moveTo(x + width - 15 - cornerSize, y + height - 15)
           .lineTo(x + width - 15, y + height - 15)
           .lineTo(x + width - 15, y + height - 15 - cornerSize)
           .stroke();
  }

  // Add COMSATS header
  addHeader(resultData) {
    this.currentY = this.margins.top + 50;

    // COMSATS Logo area (simple circle with text)
    this.doc.fillColor('#ffffff')
           .circle(this.margins.left + 40, this.currentY + 20, 25)
           .fill();
    
    this.doc.strokeColor(this.colors.primary)
           .lineWidth(2)
           .circle(this.margins.left + 40, this.currentY + 20, 25)
           .stroke();

    this.doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('CUI', this.margins.left + 40, this.currentY + 15, { align: 'center', width: 0 });

    // University name and details
    this.doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('COMSATS UNIVERSITY ISLAMABAD', this.margins.left + 100, this.currentY);
    
    this.doc.fontSize(12)
           .font('Helvetica')
           .fillColor(this.colors.secondary)
           .text('Faculty of Computer Science', this.margins.left + 100, this.currentY + 25)
           .text('Internship Management Portal', this.margins.left + 100, this.currentY + 40);

    this.currentY += 80;

    // Document title
    this.doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('FINAL INTERNSHIP EVALUATION RESULTS', this.margins.left, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.currentY += 40;

    // Decorative line
    const lineWidth = this.contentWidth * 0.6;
    const lineX = (this.pageWidth - lineWidth) / 2;
    
    this.doc.strokeColor(this.colors.accent)
           .lineWidth(3)
           .moveTo(lineX, this.currentY)
           .lineTo(lineX + lineWidth, this.currentY)
           .stroke();

    this.currentY += 30;

    // Document info
    const docId = `RES-${resultData.studentInfo?.rollNumber || 'XXX'}-${new Date().getFullYear()}`;
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.doc.fontSize(10)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text(`Document ID: ${docId}`, this.margins.left, this.currentY)
           .text(`Generated: ${generatedDate}`, this.margins.left + this.contentWidth / 2, this.currentY, {
             align: 'right',
             width: this.contentWidth / 2
           });

    this.currentY += 40;
  }

  // Add student information section
  addStudentInfo(resultData) {
    this.checkPageBreak(120);

    // Section header
    this.addSectionHeader('STUDENT INFORMATION');

    // Student info table
    const studentData = [
      ['Student Name', resultData.studentInfo?.name || 'N/A'],
      ['Registration Number', resultData.studentInfo?.rollNumber || 'N/A'],
      ['Department', resultData.studentInfo?.department || 'Computer Science'],
      ['Email Address', resultData.studentInfo?.email || 'N/A']
    ];

    this.addInfoTable(studentData);
    this.currentY += 30;
  }

  // Add internship information section
  addInternshipInfo(resultData) {
    this.checkPageBreak(140);

    // Section header
    this.addSectionHeader('INTERNSHIP INFORMATION');

    // Internship info table
    const internshipData = [
      ['Company Name', resultData.internshipInfo?.companyName || 'N/A'],
      ['Position Title', resultData.internshipInfo?.position || 'N/A'],
      ['Supervisor Name', resultData.internshipInfo?.supervisorName || 'N/A'],
      ['Duration', resultData.internshipInfo?.duration || '12 Weeks'],
      ['Start Date', resultData.internshipInfo?.startDate ? 
        new Date(resultData.internshipInfo.startDate).toLocaleDateString() : 'N/A'],
      ['End Date', resultData.internshipInfo?.endDate ? 
        new Date(resultData.internshipInfo.endDate).toLocaleDateString() : 'N/A']
    ];

    this.addInfoTable(internshipData);
    this.currentY += 30;
  }

  // Add evaluation results section
  addEvaluationResults(resultData) {
    this.checkPageBreak(200);

    // Section header
    this.addSectionHeader('EVALUATION RESULTS');

    // Results table header
    this.doc.fillColor(this.colors.primary)
           .rect(this.margins.left, this.currentY, this.contentWidth, 25)
           .fill();
    
    this.doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text('Assessment Component', this.margins.left + 10, this.currentY + 8)
           .text('Obtained', this.margins.left + 200, this.currentY + 8)
           .text('Total', this.margins.left + 280, this.currentY + 8)
           .text('Percentage', this.margins.left + 350, this.currentY + 8);

    this.currentY += 25;

    // Supervisor evaluation row
    this.addResultRow(
      'Supervisor Evaluation (60%)',
      `${resultData.evaluation?.supervisorMarks || 0}`,
      '60',
      `${resultData.breakdown?.supervisorScore?.toFixed(1) || '0.0'}%`,
      true
    );

    // Company evaluation row
    this.addResultRow(
      'Company Evaluation (40%)',
      `${resultData.evaluation?.companyMarks || 0}`,
      '40',
      `${resultData.breakdown?.companyScore?.toFixed(1) || '0.0'}%`,
      false
    );

    this.currentY += 20;

    // Final result box
    this.addFinalResultBox(resultData);
  }

  // Add final result box
  addFinalResultBox(resultData) {
    const totalMarks = resultData.evaluation?.totalMarks || 0;
    const grade = resultData.evaluation?.grade || 'F';
    
    // Result background box
    this.doc.fillColor('#f0f9ff')
           .rect(this.margins.left, this.currentY, this.contentWidth, 80)
           .fill();
    
    this.doc.strokeColor(this.colors.primary)
           .lineWidth(2)
           .rect(this.margins.left, this.currentY, this.contentWidth, 80)
           .stroke();
    
    // "Final Total:" label
    this.doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('Final Total:', this.margins.left + 20, this.currentY + 20);
    
    // Score display
    this.doc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor(this.colors.success)
           .text(`${totalMarks}/100`, this.margins.left + 20, this.currentY + 45);
    
    // Grade display with color coding
    let gradeColor = '#ef4444'; // Red default
    if (['A+', 'A', 'A-'].includes(grade)) gradeColor = '#10b981'; // Green
    else if (['B+', 'B', 'B-'].includes(grade)) gradeColor = '#3b82f6'; // Blue
    else if (['C+', 'C', 'C-'].includes(grade)) gradeColor = '#f59e0b'; // Orange
    
    this.doc.fontSize(36)
           .font('Helvetica-Bold')
           .fillColor(gradeColor)
           .text(grade, this.margins.left + 350, this.currentY + 35);

    // Performance assessment
    let performance = 'Needs Improvement';
    if (totalMarks >= 90) performance = 'Outstanding Performance';
    else if (totalMarks >= 85) performance = 'Excellent Performance';
    else if (totalMarks >= 75) performance = 'Good Performance';
    else if (totalMarks >= 65) performance = 'Satisfactory Performance';
    else if (totalMarks >= 50) performance = 'Average Performance';
    
    this.doc.fontSize(12)
           .font('Helvetica')
           .fillColor(this.colors.text)
           .text(`Performance Level: ${performance}`, this.margins.left + 200, this.currentY + 20);

    this.currentY += 100;
  }

  // Add signature section
  addSignatureSection() {
    this.checkPageBreak(100);

    this.currentY += 20;

    // Signature boxes
    const signatureWidth = (this.contentWidth - 40) / 2;
    
    // Student signature
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .rect(this.margins.left, this.currentY, signatureWidth, 60)
           .stroke();
    
    // Academic officer signature
    this.doc.rect(this.margins.left + signatureWidth + 40, this.currentY, signatureWidth, 60)
           .stroke();
    
    // Labels
    this.doc.fontSize(10)
           .font('Helvetica')
           .fillColor(this.colors.text)
           .text('Student Signature', this.margins.left + 10, this.currentY + 45)
           .text('Academic Officer', this.margins.left + signatureWidth + 50, this.currentY + 45);
    
    // Date lines
    this.doc.text(`Date: ${new Date().toLocaleDateString()}`, this.margins.left + 10, this.currentY + 70)
           .text('Date: _______________', this.margins.left + signatureWidth + 50, this.currentY + 70);

    this.currentY += 100;
  }

  // Helper methods
  addSectionHeader(title) {
    this.doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text(title, this.margins.left, this.currentY);
    
    this.doc.strokeColor(this.colors.secondary)
           .lineWidth(2)
           .moveTo(this.margins.left, this.currentY + 20)
           .lineTo(this.margins.left + this.contentWidth, this.currentY + 20)
           .stroke();

    this.currentY += 35;
  }

  addInfoTable(data) {
    data.forEach((item, index) => {
      const [label, value] = item;
      const rowHeight = 25;
      
      // Alternate row background
      if (index % 2 === 0) {
        this.doc.fillColor('#f8fafc')
               .rect(this.margins.left, this.currentY, this.contentWidth, rowHeight)
               .fill();
      }
      
      // Border
      this.doc.strokeColor(this.colors.border)
             .lineWidth(1)
             .rect(this.margins.left, this.currentY, this.contentWidth, rowHeight)
             .stroke();
      
      // Label
      this.doc.fontSize(11)
             .font('Helvetica-Bold')
             .fillColor(this.colors.primary)
             .text(label + ':', this.margins.left + 10, this.currentY + 8);
      
      // Value
      this.doc.font('Helvetica')
             .fillColor(this.colors.text)
             .text(value, this.margins.left + 150, this.currentY + 8);
      
      this.currentY += rowHeight;
    });
  }

  addResultRow(component, obtained, total, percentage, isAlternate) {
    const rowHeight = 25;
    
    // Background
    if (isAlternate) {
      this.doc.fillColor('#f8fafc')
             .rect(this.margins.left, this.currentY, this.contentWidth, rowHeight)
             .fill();
    }
    
    // Border
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .rect(this.margins.left, this.currentY, this.contentWidth, rowHeight)
           .stroke();
    
    // Content
    this.doc.fontSize(11)
           .font('Helvetica')
           .fillColor(this.colors.text)
           .text(component, this.margins.left + 10, this.currentY + 8)
           .text(obtained, this.margins.left + 210, this.currentY + 8)
           .text(total, this.margins.left + 290, this.currentY + 8)
           .text(percentage, this.margins.left + 360, this.currentY + 8);

    this.currentY += rowHeight;
  }

  addFooter() {
    const footerY = this.pageHeight - this.margins.bottom - 20;
    
    // Footer background
    this.doc.fillColor(this.colors.primary)
           .rect(0, footerY, this.pageWidth, 20)
           .fill();
    
    // Footer text
    this.doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#ffffff')
           .text('COMSATS University Islamabad - Department of Computer Science', 
                 this.margins.left, footerY + 6)
           .text('Official Document - Confidential', 
                 this.margins.left + this.contentWidth / 2, footerY + 6, {
                   align: 'right',
                   width: this.contentWidth / 2
                 });
  }

  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom - 40) {
      this.doc.addPage();
      this.addPageBorder();
      this.addFooter();
      this.currentY = this.margins.top + 30;
    }
  }

  // Main generation method
  generate(resultData) {
    this.createDocument();
    this.addPageBorder();
    this.addHeader(resultData);
    this.addStudentInfo(resultData);
    this.addInternshipInfo(resultData);
    this.addEvaluationResults(resultData);
    this.addSignatureSection();
    this.addFooter();

    return this.doc;
  }
}

// Export function
const generateResultsPDF = (resultData) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfGenerator = new FinalResultsPDF();
      const doc = pdfGenerator.generate(resultData);
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);
      
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { FinalResultsPDF, generateResultsPDF };