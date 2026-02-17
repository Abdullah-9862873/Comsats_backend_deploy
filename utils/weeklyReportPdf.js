const PDFDocument = require('pdfkit');

class FinalInternshipReportPDF {
  constructor() {
    this.doc = null;
    this.pageWidth = 0;
    this.pageHeight = 0;
    this.margins = { top: 60, bottom: 60, left: 60, right: 60 };
    this.colors = {
      primary: '#1e40af',      // Deep blue
      secondary: '#3b82f6',    // Blue
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
        Title: 'Final Internship Report',
        Subject: 'Comprehensive Final Internship Report',
        Keywords: 'internship, report, final, professional, weekly'
      }
    });

    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
    this.currentY = this.margins.top;

    return this.doc;
  }

  // Add decorative border to the page (same as completion certificate)
  addPageBorder() {
    const borderMargin = 20;
    const x = borderMargin;
    const y = borderMargin;
    const width = this.pageWidth - (borderMargin * 2);
    const height = this.pageHeight - (borderMargin * 2);

    // Outer border - thick
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

  // Add professional header for the report
  addReportHeader(reportData) {
    this.currentY = this.margins.top + 50;

    // Report title with professional styling
    this.doc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('FINAL INTERNSHIP REPORT', this.margins.left, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.currentY += 50;

    // Subtitle
    this.doc.fontSize(16)
           .font('Helvetica')
           .fillColor(this.colors.secondary)
           .text('COMPREHENSIVE WEEKLY ACTIVITY SUMMARY', this.margins.left, this.currentY, {
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

    // Report information
    const reportInfo = `Report No: RPT-${reportData._id ? reportData._id.toString().slice(-8).toUpperCase() : 'DRAFT'}`;
    const generatedDate = `Generated on: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;

    this.doc.fontSize(10)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text(reportInfo, this.margins.left, this.currentY, {
             width: this.contentWidth / 2,
             align: 'left'
           })
           .text(generatedDate, this.margins.left + this.contentWidth / 2, this.currentY, {
             width: this.contentWidth / 2,
             align: 'right'
           });

    this.currentY += 50;
  }

  // Add student and company information section
  addStudentCompanyInfo(reportData) {
    this.checkPageBreak(150);

    // Section header with background
    this.addSectionHeader('STUDENT & COMPANY INFORMATION');

    // Create two-column layout
    const leftColumn = this.margins.left;
    const rightColumn = this.margins.left + (this.contentWidth / 2) + 20;
    const columnWidth = (this.contentWidth / 2) - 20;

    // Student Information (Left Column)
    this.doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('Student Information', leftColumn, this.currentY);

    this.currentY += 25;

    const studentInfo = [
      { label: 'Name', value: reportData.studentName || 'N/A' },
      { label: 'Roll Number', value: reportData.studentRollNo || reportData.rollNumber || 'N/A' },
      { label: 'Department', value: reportData.department || 'Computer Science' },
      { label: 'Email', value: reportData.studentEmail || 'N/A' }
    ];

    studentInfo.forEach((info, index) => {
      this.addInfoField(info.label, info.value, leftColumn, columnWidth);
    });

    // Company Information (Right Column)
    const companyY = this.currentY - (studentInfo.length * 25);
    
    this.doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('Company Information', rightColumn, companyY);

    const companyInfo = [
      { label: 'Company', value: reportData.companyName || 'N/A' },
      { label: 'Supervisor', value: reportData.supervisorName || 'N/A' },
      { label: 'Position', value: reportData.position || 'N/A' },
      { label: 'Week Number', value: `Week ${reportData.weekNumber || 'N/A'}` }
    ];

    let infoY = companyY + 25;
    companyInfo.forEach((info, index) => {
      this.doc.fontSize(11)
             .font('Helvetica-Bold')
             .fillColor(this.colors.text)
             .text(`${info.label}:`, rightColumn, infoY)
             .font('Helvetica')
             .fillColor(this.colors.textLight)
             .text(info.value, rightColumn + 80, infoY, {
               width: columnWidth - 80
             });
      infoY += 25;
    });

    this.currentY += 40;
  }

  // Add info field helper
  addInfoField(label, value, x, width) {
    this.doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor(this.colors.text)
           .text(`${label}:`, x, this.currentY)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text(value, x + 80, this.currentY, {
             width: width - 80
           });
    this.currentY += 25;
  }

  // Add section header with professional styling
  addSectionHeader(title) {
    this.checkPageBreak(80);

    // Background rectangle
    this.doc.fillColor(this.colors.background)
           .rect(this.margins.left - 10, this.currentY - 5, this.contentWidth + 20, 35)
           .fill();

    // Border line
    this.doc.strokeColor(this.colors.primary)
           .lineWidth(2)
           .moveTo(this.margins.left, this.currentY + 25)
           .lineTo(this.margins.left + this.contentWidth, this.currentY + 25)
           .stroke();

    // Section title
    this.doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text(title, this.margins.left, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.currentY += 50;
  }

  // Add content section with professional formatting
  addContentSection(sectionNumber, title, content) {
    this.checkPageBreak(120);

    // Section number and title
    this.doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text(`${sectionNumber}. ${title}`, this.margins.left, this.currentY);

    this.currentY += 25;

    // Content background
    const contentHeight = this.calculateTextHeight(content || 'No content provided', 11, this.contentWidth - 20);
    const paddedHeight = Math.max(contentHeight + 20, 60);

    this.doc.fillColor(this.colors.background)
           .rect(this.margins.left, this.currentY, this.contentWidth, paddedHeight)
           .fill();

    // Content border
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .rect(this.margins.left, this.currentY, this.contentWidth, paddedHeight)
           .stroke();

    // Content text
    this.doc.fontSize(11)
           .font('Helvetica')
           .fillColor(this.colors.text)
           .text(content || 'No content provided', 
                 this.margins.left + 10, 
                 this.currentY + 10, {
                   width: this.contentWidth - 20,
                   align: 'justify'
                 });

    this.currentY += paddedHeight + 25;
  }

  // Add supporting documents section
  addSupportingDocuments(files) {
    this.checkPageBreak(100);

    this.doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('SUPPORTING DOCUMENTS', this.margins.left, this.currentY);

    this.currentY += 25;

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        const fileName = file.originalname || file.filename || `Document ${index + 1}`;
        const fileSize = file.size ? this.formatFileSize(file.size) : 'Unknown size';
        
        // File icon (bullet point)
        this.doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor(this.colors.accent)
               .text('📄', this.margins.left, this.currentY);

        // File details
        this.doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor(this.colors.text)
               .text(fileName, this.margins.left + 25, this.currentY)
               .font('Helvetica')
               .fillColor(this.colors.textLight)
               .text(`(${fileSize})`, this.margins.left + 25, this.currentY + 15);

        this.currentY += 35;
      });
    } else {
      this.doc.fontSize(11)
             .font('Helvetica')
             .fillColor(this.colors.textLight)
             .text('No supporting documents attached', this.margins.left, this.currentY);
      this.currentY += 25;
    }
  }

  // Add professional footer
  addFooter() {
    const footerY = this.pageHeight - this.margins.bottom - 30;
    
    // Footer line
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .moveTo(this.margins.left, footerY)
           .lineTo(this.margins.left + this.contentWidth, footerY)
           .stroke();

    // Footer text
    this.doc.fontSize(9)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text('COMSATS University Islamabad - Wah Campus', 
                 this.margins.left, footerY + 10, {
                   width: this.contentWidth / 2,
                   align: 'left'
                 })
           .text('Internship Portal - Confidential Document', 
                 this.margins.left + this.contentWidth / 2, footerY + 10, {
                   width: this.contentWidth / 2,
                   align: 'right'
                 });
  }

  // Check if we need a page break
  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom - 50) {
      this.doc.addPage();
      this.addPageBorder();
      this.addFooter();
      this.currentY = this.margins.top + 30;
    }
  }

  // Calculate text height
  calculateTextHeight(text, fontSize, width) {
    if (!text) return 20;
    const avgCharWidth = fontSize * 0.6;
    const charsPerLine = Math.floor(width / avgCharWidth);
    const lines = Math.ceil(text.length / charsPerLine);
    return lines * (fontSize + 4);
  }

  // Format file size
  formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Main generation method
  generate(reportData) {
    this.createDocument();
    this.addPageBorder();

    // Add all sections
    this.addReportHeader(reportData);
    this.addStudentCompanyInfo(reportData);
    
    // Main content sections
    this.addContentSection('1', 'WEEKLY ACCOMPLISHMENTS', reportData.tasksCompleted);
    this.addContentSection('2', 'REFLECTIONS & LEARNINGS', reportData.reflections);
    this.addContentSection('3', 'ADDITIONAL INSIGHTS', reportData.supportingMaterials);
    
    // Supporting documents
    this.addSupportingDocuments(reportData.supportingFiles);

    // Add footer to all pages
    this.addFooter();

    return this.doc;
  }
}

// Legacy class for backward compatibility
class SimpleWeeklyReportPDF {
  constructor() {
    this.finalReport = new FinalInternshipReportPDF();
  }

  generate(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.finalReport.generate(reportData);
        
        if (outputPath) {
          const fs = require('fs');
          const stream = fs.createWriteStream(outputPath);
          doc.pipe(stream);
          doc.end();
          
          stream.on('finish', () => resolve(outputPath));
          stream.on('error', reject);
        } else {
          doc.end();
          resolve(doc);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

// Export both classes for compatibility
module.exports = { 
  SimpleWeeklyReportPDF, 
  FinalInternshipReportPDF,
  generateFinalInternshipReportPDF: (reportData) => {
    const pdfGenerator = new FinalInternshipReportPDF();
    return pdfGenerator.generate(reportData);
  },
  // Main export function for backward compatibility
  generateWeeklyReportPDF: (reportData, outputPath = null) => {
    if (outputPath) {
      // File-based generation (legacy)
      const pdfGenerator = new SimpleWeeklyReportPDF();
      return pdfGenerator.generate(reportData, outputPath);
    } else {
      // Buffer-based generation (new beautiful design)
      return new Promise((resolve, reject) => {
        try {
          const pdfGenerator = new FinalInternshipReportPDF();
          const doc = pdfGenerator.generate(reportData);
          
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
    }
  }
};
