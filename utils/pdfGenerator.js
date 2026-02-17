const PDFDocument = require('pdfkit');

// Professional PDF styling constants for COMSATS University
const COMSATS_STYLES = {
  colors: {
    primary: '#003366',      // COMSATS Navy Blue
    secondary: '#00509E',    // COMSATS Blue  
    lightBlue: '#E3F2FD',   // Light blue background
    text: '#212121',         // Dark text
    lightText: '#424242',    // Lighter text
    border: '#BDBDBD',       // Border color
    white: '#FFFFFF',
    success: '#4CAF50'
  },
  fonts: {
    regular: 'Times-Roman',
    bold: 'Times-Bold',
    italic: 'Times-Italic'
  },
  sizes: {
    title: 18,
    heading: 14,
    subheading: 12,
    body: 12,
    small: 10
  }
};

class ProfessionalJoiningReportPDF {
  constructor(title = 'COMSATS Internship Joining Report') {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 36,    // 0.5 inch
        bottom: 36, // 0.5 inch  
        left: 36,   // 0.5 inch
        right: 36   // 0.5 inch
      },
      info: {
        Title: title,
        Author: 'COMSATS University Islamabad',
        Subject: 'Internship Joining Report',
        Creator: 'COMSATS Internship Portal',
        Keywords: 'COMSATS, Internship, Joining Report'
      }
    });
    
    // A4 dimensions: 595.28 x 841.89 points
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.margins = { top: 36, bottom: 36, left: 36, right: 36 };
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
    this.currentY = this.margins.top;
  }

  // Add COMSATS header with proper A4 formatting
  addHeader() {
    const headerHeight = 50;
    
    // University header background
    this.doc.rect(0, 0, this.pageWidth, headerHeight)
           .fill(COMSATS_STYLES.colors.primary);
    
    // COMSATS Logo area (simple circle with text)
    this.doc.circle(70, 25, 15)
           .fill(COMSATS_STYLES.colors.white);
    
    this.doc.fillColor(COMSATS_STYLES.colors.primary)
           .fontSize(8)
           .font(COMSATS_STYLES.fonts.bold)
           .text('CUI', 65, 21);
    
    // University name and details
    this.doc.fillColor(COMSATS_STYLES.colors.white)
           .fontSize(14)
           .font(COMSATS_STYLES.fonts.bold)
           .text('COMSATS UNIVERSITY ISLAMABAD', 95, 12);
    
    this.doc.fontSize(9)
           .font(COMSATS_STYLES.fonts.regular)
           .text('Internship Management Portal', 95, 32);
    
    this.currentY = headerHeight + 10;
    return this;
  }

  // Add document title
  addTitle(title) {
    this.doc.fillColor(COMSATS_STYLES.colors.primary)
           .fontSize(16)
           .font(COMSATS_STYLES.fonts.bold)
           .text(title, this.margins.left, this.currentY, {
             width: this.contentWidth,
             align: 'center'
           });
    
    this.currentY += 20;
    
    // Add decorative line
    this.doc.moveTo(this.margins.left + 80, this.currentY)
           .lineTo(this.pageWidth - this.margins.right - 80, this.currentY)
           .stroke(COMSATS_STYLES.colors.secondary);
    
    this.currentY += 15;
    return this;
  }

  // Add section heading with proper formatting
  addSectionHeading(text) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 200) {
      this.addNewPage();
    }
    
    this.doc.fillColor(COMSATS_STYLES.colors.primary)
           .fontSize(12)
           .font(COMSATS_STYLES.fonts.bold)
           .text(text, this.margins.left, this.currentY);
    
    this.currentY += 15;
    
    // Add underline
    this.doc.moveTo(this.margins.left, this.currentY - 3)
           .lineTo(this.margins.left + this.doc.widthOfString(text) + 15, this.currentY - 3)
           .stroke(COMSATS_STYLES.colors.secondary);
    
    this.currentY += 8;
    return this;
  }

  // Add information table with proper formatting
  addInfoTable(data) {
    const rowHeight = 20;
    const labelWidth = 160;
    
    data.forEach((item, index) => {
      // Check for page break
      if (this.currentY + rowHeight > this.pageHeight - this.margins.bottom - 30) {
        this.addNewPage();
      }
      
      const [label, value] = item;
      const y = this.currentY;
      
      // Alternate row background
      if (index % 2 === 0) {
        this.doc.rect(this.margins.left, y, this.contentWidth, rowHeight)
               .fill(COMSATS_STYLES.colors.lightBlue);
      }
      
      // Add border
      this.doc.rect(this.margins.left, y, this.contentWidth, rowHeight)
             .stroke(COMSATS_STYLES.colors.border);
      
      // Label
      this.doc.fillColor(COMSATS_STYLES.colors.primary)
             .fontSize(10)
             .font(COMSATS_STYLES.fonts.bold)
             .text(label + ':', this.margins.left + 6, y + 5, {
               width: labelWidth - 12
             });
      
      // Value
      this.doc.fillColor(COMSATS_STYLES.colors.text)
             .fontSize(10)
             .font(COMSATS_STYLES.fonts.regular)
             .text(value || 'N/A', this.margins.left + labelWidth, y + 5, {
               width: this.contentWidth - labelWidth - 12
             });
      
      this.currentY += rowHeight;
    });
    
    this.currentY += 10;
    return this;
  }

  // Add content section with proper text wrapping
  addContentSection(title, content) {
    if (!content || !content.trim()) return this;
    
    // Add section title
    this.addSectionHeading(title);
    
    // Calculate content height to check for page breaks
    const lines = this.doc.heightOfString(content, {
      width: this.contentWidth - 20,
      align: 'justify'
    });
    
    // Check if content fits on current page
    if (this.currentY + lines + 40 > this.pageHeight - this.margins.bottom) {
      this.addNewPage();
    }
    
    // Content background
    this.doc.rect(this.margins.left, this.currentY, this.contentWidth, lines + 20)
           .fill(COMSATS_STYLES.colors.lightBlue)
           .stroke(COMSATS_STYLES.colors.border);
    
    // Content text
    this.doc.fillColor(COMSATS_STYLES.colors.text)
           .fontSize(10)
           .font(COMSATS_STYLES.fonts.regular)
           .text(content, this.margins.left + 8, this.currentY + 8, {
             width: this.contentWidth - 16,
             align: 'justify',
             lineGap: 1
           });
    
    this.currentY += lines + 15;
    return this;
  }

  // Add acknowledgment section
  addAcknowledgment(items = []) {
    this.addSectionHeading('ACKNOWLEDGMENT & DECLARATION');
    
    const defaultItems = [
      'I have successfully joined the internship program at the mentioned organization',
      'All information provided in this report is accurate and complete',
      'I understand my responsibilities and commitments as an intern',
      'I will adhere to the company policies and maintain professionalism throughout the internship'
    ];
    
    const ackItems = items.length > 0 ? items : defaultItems;
    
    // Calculate required height
    let totalHeight = 50;
    ackItems.forEach(item => {
      totalHeight += this.doc.heightOfString(`• ${item}`, {
        width: this.contentWidth - 40
      }) + 5;
    });
    
    // Check for page break
    if (this.currentY + totalHeight > this.pageHeight - this.margins.bottom) {
      this.addNewPage();
    }
    
    // Acknowledgment box
    this.doc.rect(this.margins.left, this.currentY, this.contentWidth, totalHeight)
           .fill(COMSATS_STYLES.colors.lightBlue)
           .stroke(COMSATS_STYLES.colors.primary);
    
    // Header text
    this.doc.fillColor(COMSATS_STYLES.colors.primary)
           .fontSize(COMSATS_STYLES.sizes.subheading)
           .font(COMSATS_STYLES.fonts.bold)
           .text('I hereby confirm that:', this.margins.left + 15, this.currentY + 15);
    
    let itemY = this.currentY + 40;
    
    // List items
    ackItems.forEach(item => {
      this.doc.fillColor(COMSATS_STYLES.colors.text)
             .fontSize(COMSATS_STYLES.sizes.body)
             .font(COMSATS_STYLES.fonts.regular)
             .text(`• ${item}`, this.margins.left + 15, itemY, {
               width: this.contentWidth - 30,
               align: 'justify'
             });
      
      itemY += this.doc.heightOfString(`• ${item}`, {
        width: this.contentWidth - 30
      }) + 8;
    });
    
    this.currentY += totalHeight + 20;
    return this;
  }

  // Add signature section
  addSignatureSection() {
    // Check for page break
    if (this.currentY + 60 > this.pageHeight - this.margins.bottom) {
      this.addNewPage();
    }
    
    const signatureWidth = (this.contentWidth - 20) / 2;
    
    // Student signature box
    this.doc.rect(this.margins.left, this.currentY, signatureWidth, 45)
           .stroke(COMSATS_STYLES.colors.border);
    
    // Date box  
    this.doc.rect(this.margins.left + signatureWidth + 10, this.currentY, signatureWidth, 45)
           .stroke(COMSATS_STYLES.colors.border);
    
    // Labels
    this.doc.fillColor(COMSATS_STYLES.colors.text)
           .fontSize(9)
           .font(COMSATS_STYLES.fonts.regular)
           .text('Student Signature', this.margins.left + 8, this.currentY + 32)
           .text('Date: ' + new Date().toLocaleDateString(), this.margins.left + signatureWidth + 18, this.currentY + 32);
    
    this.currentY += 55;
    return this;
  }

  // Add footer
  addFooter() {
    const footerY = this.pageHeight - 30;
    
    // Footer line
    this.doc.moveTo(this.margins.left, footerY)
           .lineTo(this.pageWidth - this.margins.right, footerY)
           .stroke(COMSATS_STYLES.colors.border);
    
    // Footer text
    this.doc.fillColor(COMSATS_STYLES.colors.lightText)
           .fontSize(COMSATS_STYLES.sizes.small)
           .font(COMSATS_STYLES.fonts.regular)
           .text('COMSATS University Islamabad - Internship Management Portal', 
                 this.margins.left, footerY + 10)
           .text(`Generated on: ${new Date().toLocaleDateString()}`, 
                 this.margins.left, footerY + 25)
           .text('Page 1 of 1', 
                 this.pageWidth - this.margins.right - 60, footerY + 10);
    
    return this;
  }

  // Add new page with header
  addNewPage() {
    this.doc.addPage();
    this.currentY = this.margins.top + 20;
    
    // Add small header for continuation pages
    this.doc.fillColor(COMSATS_STYLES.colors.primary)
           .fontSize(COMSATS_STYLES.sizes.subheading)
           .font(COMSATS_STYLES.fonts.bold)
           .text('COMSATS University Islamabad - Internship Joining Report (Continued)', 
                 this.margins.left, this.currentY);
    
    this.currentY += 30;
    return this;
  }

  // Get PDF document for streaming
  getDocument() {
    return this.doc;
  }

  // Finalize PDF
  finalize() {
    this.addFooter();
    this.doc.end();
    return this;
  }
}

// Enhanced COMSATS PDF Generator class (keeping existing for compatibility)
class COMSATSPDFGenerator extends ProfessionalJoiningReportPDF {
  constructor(title, author) {
    super(title);
  }

  // Maintain compatibility with existing methods
  createHeader(reportType) {
    return this.addHeader();
  }

  createSectionHeader(title) {
    return this.addSectionHeading(title);
  }

  createInfoTable(data) {
    return this.addInfoTable(data);
  }

  createContentSection(title, content) {
    return this.addContentSection(title, content);
  }

  createAcknowledgmentSection(items) {
    return this.addAcknowledgment(items);
  }

  createSignatureSection() {
    return this.addSignatureSection();
  }

  createFooter() {
    return this.addFooter();
  }

  addWatermark(text) {
    // Add subtle watermark
    this.doc.fillColor('#f5f5f5')
           .fontSize(60)
           .font('Times-Bold')
           .text(text, 0, this.pageHeight / 2 - 50, {
             width: this.pageWidth,
             align: 'center',
             opacity: 0.1
           });
    return this;
  }
}

module.exports = { 
  COMSATSPDFGenerator, 
  ProfessionalJoiningReportPDF,
  COMSATS_COLORS: COMSATS_STYLES.colors 
};