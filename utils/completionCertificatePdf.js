const PDFDocument = require('pdfkit');

class CompletionCertificatePDF {
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
      border: '#e5e7eb'        // Light border
    };
  }

  createDocument() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: this.margins,
      info: {
        Title: 'Internship Completion Certificate',
        Subject: 'Official Internship Completion Certificate',
        Keywords: 'internship, certificate, completion, professional'
      }
    });

    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;

    return this.doc;
  }

  // Add decorative border to the page
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

  // Add certificate header with logo space
  addCertificateHeader(certificateData) {
    let yPos = this.margins.top + 50;

    // Certificate title with better spacing
    this.doc.fontSize(28)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('CERTIFICATE OF COMPLETION', this.margins.left, yPos, {
             width: this.contentWidth,
             align: 'center'
           });

    yPos += 60; // Increased spacing to prevent overlap

    // Subtitle with better positioning
    this.doc.fontSize(16)
           .font('Helvetica')
           .fillColor(this.colors.secondary)
           .text('INTERNSHIP PROGRAM', this.margins.left, yPos, {
             width: this.contentWidth,
             align: 'center'
           });

    yPos += 50; // More spacing before decorative line

    // Decorative line
    const lineY = yPos;
    const lineWidth = this.contentWidth * 0.6;
    const lineX = (this.pageWidth - lineWidth) / 2;
    
    this.doc.strokeColor(this.colors.accent)
           .lineWidth(3)
           .moveTo(lineX, lineY)
           .lineTo(lineX + lineWidth, lineY)
           .stroke();

    yPos += 40; // Spacing after decorative line

    // Certificate number and date with better positioning
    const certInfo = `Certificate No: ${certificateData.certificateNumber || 'N/A'}`;
    const issueDate = `Issued on: ${new Date(certificateData.submittedAt || new Date()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;

    this.doc.fontSize(10)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text(certInfo, this.margins.left, yPos, {
             width: this.contentWidth / 2,
             align: 'left'
           })
           .text(issueDate, this.margins.left + this.contentWidth / 2, yPos, {
             width: this.contentWidth / 2,
             align: 'right'
           });

    return yPos + 50; // Return position for next section
  }

  // Add professional information section
  addInformationSection(title, data, yPos) {
    // Check if section fits on current page
    const sectionHeight = 25 + (data.length * 20) + 15;
    if (yPos + sectionHeight > this.pageHeight - this.margins.bottom - 40) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 50;
    }

    // Section header with background
    const headerHeight = 22;
    this.doc.fillColor(this.colors.primary)
           .rect(this.margins.left, yPos, this.contentWidth, headerHeight)
           .fill();

    this.doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('white')
           .text(title, this.margins.left + 12, yPos + 5, {
             width: this.contentWidth - 24,
             align: 'left'
           });

    yPos += headerHeight + 12;

    // Information grid
    const leftColumnWidth = this.contentWidth * 0.35;
    const rightColumnStart = this.margins.left + leftColumnWidth + 15;
    const rightColumnWidth = this.contentWidth - leftColumnWidth - 15;
    const lineHeight = 18;

    data.forEach(([label, value], index) => {
      const isEvenRow = index % 2 === 0;
      
      // Alternate row background
      if (isEvenRow) {
        this.doc.fillColor('#f8f9fa')
               .rect(this.margins.left, yPos - 2, this.contentWidth, lineHeight)
               .fill();
      }

      // Label
      this.doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor(this.colors.text)
             .text(label, this.margins.left + 8, yPos, {
               width: leftColumnWidth - 8
             });

      // Value - ensure it doesn't overflow
      const displayValue = (value || 'N/A').toString().substring(0, 50); // Limit length
      this.doc.fontSize(10)
             .font('Helvetica')
             .fillColor(this.colors.text)
             .text(displayValue, rightColumnStart, yPos, {
               width: rightColumnWidth - 10,
               ellipsis: true
             });

      yPos += lineHeight;
    });

    return yPos + 12;
  }

  // Add detailed text section
  addDetailedSection(title, content, yPos, maxHeight = 70) {
    // Check if we need a new page - more conservative approach
    const neededSpace = maxHeight + 50; // Section title + content + spacing
    if (yPos + neededSpace > this.pageHeight - this.margins.bottom - 40) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 40;
    }

    // Section title
    this.doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text(title, this.margins.left, yPos);

    yPos += 22; // Spacing after title

    // Content box with border - ensure it fits within page
    const availableHeight = this.pageHeight - yPos - this.margins.bottom - 50;
    const contentHeight = Math.min(maxHeight, availableHeight, 65); // Max 65px to be safe
    
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .rect(this.margins.left, yPos, this.contentWidth, contentHeight)
           .stroke();

    // Content text with proper wrapping and line breaks
    const textContent = (content || 'Not provided').substring(0, 500); // Limit text length
    
    this.doc.fontSize(9)
           .font('Helvetica')
           .fillColor(this.colors.text);

    // Split text into words and wrap properly
    const words = textContent.split(' ');
    const maxWordsPerLine = 15; // Limit words per line
    const lines = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }
    
    // Only show first 5 lines to prevent overflow
    const displayLines = lines.slice(0, 5);
    const lineHeight = 10;
    
    displayLines.forEach((line, index) => {
      const textY = yPos + 8 + (index * lineHeight);
      if (textY + lineHeight < yPos + contentHeight - 5) { // Check if line fits
        this.doc.text(line, this.margins.left + 8, textY, {
          width: this.contentWidth - 16,
          height: lineHeight,
          ellipsis: true
        });
      }
    });

    return yPos + contentHeight + 20; // Return next position
  }

  // Add performance rating with visual elements
  addPerformanceRating(rating, yPos) {
    // Check if we have enough space for the performance section
    const neededSpace = 100;
    if (yPos + neededSpace > this.pageHeight - this.margins.bottom - 30) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 40;
    }

    this.doc.fontSize(13)
           .font('Helvetica-Bold')
           .fillColor(this.colors.primary)
           .text('PERFORMANCE EVALUATION', this.margins.left, yPos);

    yPos += 30; // Increased spacing

    // Rating box with proper centering
    const ratingBoxWidth = 180;
    const ratingBoxHeight = 35;
    const ratingBoxX = (this.pageWidth - ratingBoxWidth) / 2;

    this.doc.fillColor(this.colors.success)
           .rect(ratingBoxX, yPos, ratingBoxWidth, ratingBoxHeight)
           .fill();

    // Rating text
    this.doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('white')
           .text(`${rating}/5`, ratingBoxX, yPos + 8, {
             width: ratingBoxWidth,
             align: 'center'
           });

    // Rating stars with proper spacing
    yPos += ratingBoxHeight + 20;
    const starSize = 18;
    const totalStars = 5;
    const starsWidth = totalStars * starSize + (totalStars - 1) * 8;
    let starX = (this.pageWidth - starsWidth) / 2;

    for (let i = 1; i <= totalStars; i++) {
      const color = i <= rating ? this.colors.accent : this.colors.border;
      
      // Simple star representation with filled circle
      this.doc.fillColor(color)
             .circle(starX + starSize/2, yPos + starSize/2, starSize/2)
             .fill();

      starX += starSize + 8;
    }

    return yPos + starSize + 30;
  }

  // Add signature section
  addSignatureSection(yPos) {
    const signatureHeight = 80;
    // Check if we need a new page for signatures
    if (yPos + signatureHeight + 60 > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 40;
    }

    // Add some spacing before signatures
    yPos += 30;

    const signatureWidth = 160;
    const signatureLineHeight = 50;
    const leftSignatureX = this.margins.left + 60;
    const rightSignatureX = this.pageWidth - this.margins.right - signatureWidth - 60;

    // Student signature
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .moveTo(leftSignatureX, yPos + signatureLineHeight)
           .lineTo(leftSignatureX + signatureWidth, yPos + signatureLineHeight)
           .stroke();

    this.doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(this.colors.text)
           .text('Student Signature', leftSignatureX, yPos + signatureLineHeight + 8, {
             width: signatureWidth,
             align: 'center'
           });

    // Supervisor signature
    this.doc.strokeColor(this.colors.border)
           .lineWidth(1)
           .moveTo(rightSignatureX, yPos + signatureLineHeight)
           .lineTo(rightSignatureX + signatureWidth, yPos + signatureLineHeight)
           .stroke();

    this.doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(this.colors.text)
           .text('Supervisor Signature', rightSignatureX, yPos + signatureLineHeight + 8, {
             width: signatureWidth,
             align: 'center'
           });

    return yPos + signatureLineHeight + 30;
  }

  // Add footer with institutional info
  addFooter() {
    const footerY = this.pageHeight - this.margins.bottom - 25;
    
    this.doc.fontSize(9)
           .font('Helvetica')
           .fillColor(this.colors.textLight)
           .text('This certificate is issued by the Internship Portal System', this.margins.left, footerY, {
             width: this.contentWidth,
             align: 'center'
           });

    this.doc.fontSize(8)
           .text('For verification, please contact the issuing institution', this.margins.left, footerY + 12, {
             width: this.contentWidth,
             align: 'center'
           });
  }

  // Main method to generate the complete certificate
  generateCertificate(certificateData) {
    this.createDocument();
    this.addPageBorder();

    let yPos = this.addCertificateHeader(certificateData);

    // Student Information
    const studentInfo = [
      ['Student Name:', certificateData.studentName],
      ['Student Email:', certificateData.studentEmail],
      ['Roll Number:', certificateData.studentRollNumber],
      ['Registration No:', certificateData.registrationNumber],
      ['Program:', certificateData.program],
      ['Academic Year:', certificateData.academicYear]
    ];

    yPos = this.addInformationSection('STUDENT INFORMATION', studentInfo, yPos);

    // Company Information
    const companyInfo = [
      ['Company Name:', certificateData.companyName],
      ['Supervisor:', certificateData.companySupervisor],
      ['Department:', certificateData.department],
      ['Designation:', certificateData.designation],
      ['Start Date:', new Date(certificateData.internshipStartDate).toLocaleDateString()],
      ['End Date:', new Date(certificateData.internshipEndDate).toLocaleDateString()],
      ['Duration:', `${certificateData.internshipDuration} months`]
    ];

    yPos = this.addInformationSection('COMPANY & INTERNSHIP DETAILS', companyInfo, yPos);

    // Performance Rating
    yPos = this.addPerformanceRating(certificateData.performanceRating || 5, yPos);

    // Start second page for detailed sections - ensure clean page break
    this.doc.addPage();
    this.addPageBorder();
    yPos = this.margins.top + 50;

    // Detailed sections with smaller heights to prevent overflow
    yPos = this.addDetailedSection('INTERNSHIP SUMMARY', certificateData.reportSummary, yPos, 60);
    yPos = this.addDetailedSection('KEY ACHIEVEMENTS', certificateData.keyAchievements, yPos, 60);
    yPos = this.addDetailedSection('TECHNICAL SKILLS ACQUIRED', certificateData.technicalSkills, yPos, 60);
    
    // Check if we need a new page for remaining sections
    if (yPos > this.pageHeight - 250) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 50;
    }
    
    yPos = this.addDetailedSection('SOFT SKILLS DEVELOPED', certificateData.softSkills, yPos, 60);
    yPos = this.addDetailedSection('OVERALL LEARNING EXPERIENCE', certificateData.overallLearning, yPos, 60);
    
    // Check again for final sections
    if (yPos > this.pageHeight - 200) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 50;
    }
    
    yPos = this.addDetailedSection('PROJECTS COMPLETED', certificateData.projectsCompleted, yPos, 60);
    yPos = this.addDetailedSection('SUPERVISOR RECOMMENDATION', certificateData.recommendationLetter, yPos, 60);

    // Add one more page for signatures if needed
    if (yPos > this.pageHeight - 120) {
      this.doc.addPage();
      this.addPageBorder();
      yPos = this.margins.top + 50;
    }

    // Signature section and footer
    this.addSignatureSection(yPos);
    this.addFooter();

    return this.doc;
  }
}

// Export function to generate completion certificate PDF
const generateCompletionCertificatePDF = (certificateData) => {
  const pdfGenerator = new CompletionCertificatePDF();
  return pdfGenerator.generateCertificate(certificateData);
};

module.exports = {
  CompletionCertificatePDF,
  generateCompletionCertificatePDF
};