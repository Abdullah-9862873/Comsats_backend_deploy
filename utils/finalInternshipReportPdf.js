const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class SimpleFinalInternshipReportPDF {
  constructor() {
    this.doc = new PDFDocument({ margin: 60 });
    this.currentY = 60;
    this.pageWidth = 612;
    this.pageHeight = 792;
    this.margin = 60;
  }

  // Add university header (centered, blue)
  addUniversityHeader() {
    this.doc
      .fontSize(24)
      .fillColor('#0066cc')
      .font('Helvetica-Bold')
      .text('COMSATS UNIVERSITY ISLAMABAD', { align: 'center' });
    
    this.doc
      .fontSize(18)
      .text('Wah Campus', { align: 'center' });
    
    this.doc.moveDown(0.5);
    
    this.doc
      .fontSize(20)
      .text('Internship Portal', { align: 'center' });
    
    this.doc.moveDown(2);
  }

  // Add title field with label and value positioning
  addTitleField(label, value) {
    this.doc
      .fontSize(14)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(label, 60, this.currentY);
    
    this.doc
      .fontSize(14)
      .font('Helvetica')
      .text(value || 'N/A', 200, this.currentY);
    
    this.currentY += 25;
  }

  // Add week title (centered)
  addReportTitle(reportTitle) {
    this.doc.moveDown(1);
    this.doc
      .fontSize(18)
      .fillColor('#0066cc')
      .font('Helvetica-Bold')
      .text(reportTitle, { align: 'center' });
    this.doc.moveDown(2);
  }

  // Add new page with border
  addNewPage() {
    this.doc.addPage();
    this.addPageBorder();
    this.currentY = 60;
  }

  // Add content section with proper formatting
  addContentSection(title, content) {
    // Bold section heading
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(title);
    
    // Add space between heading and content
    this.doc.moveDown(1.5);
    
    // Content text starting on the next line with proper indentation
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000000')
      .text(content || 'N/A', {
        width: this.pageWidth - 2 * this.margin,
        align: 'justify',
        indent: 20 // Small indent for content
      });
    
    // Add spacing after section
    this.doc.moveDown(2.5);
  }

  addPageBorder() {
    this.doc
      .rect(20, 20, this.pageWidth - 40, this.pageHeight - 40)
      .lineWidth(2)
      .strokeColor('#000000')
      .stroke();
  }

  // Generate and save PDF
  async generatePDF(reportData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Create write stream
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        // Add border to title page
        this.addPageBorder();

        // ============= TITLE PAGE =============
        this.addUniversityHeader();

        // Student Information Section - exact same as weekly reports
        this.addTitleField('Student Name :', reportData.student.name);
        this.addTitleField('Student Roll :', reportData.student.rollNo);
        this.addTitleField('Supervisor Name :', reportData.company.supervisor);
        this.addTitleField('Company Hired :', reportData.company.name);
        this.addTitleField('Department :', reportData.company.department);
        this.addTitleField('Position :', reportData.internship.title);

        // Report title
        this.addReportTitle('Final Internship Report');

        // ============= START NEW PAGE FOR CONTENT =============
        this.addNewPage();

        // Helper function to check if we need a new page
        const checkPageBreak = () => {
          if (this.currentY > 700) { // Near bottom of page
            this.addNewPage();
          }
        };

        // Add content sections based on report data with proper page breaks
        if (reportData.executiveSummary) {
          checkPageBreak();
          this.addContentSection('1). EXECUTIVE SUMMARY', reportData.executiveSummary);
        }

        if (reportData.companyOverview) {
          checkPageBreak();
          this.addContentSection('2). COMPANY OVERVIEW', reportData.companyOverview);
        }

        if (reportData.projectDescription) {
          checkPageBreak();
          this.addContentSection('3). PROJECT DESCRIPTION', reportData.projectDescription);
        }

        if (reportData.skillsLearned) {
          checkPageBreak();
          this.addContentSection('4). SKILLS LEARNED', reportData.skillsLearned);
        }

        if (reportData.challenges) {
          checkPageBreak();
          this.addContentSection('5). CHALLENGES FACED', reportData.challenges);
        }

        if (reportData.achievements) {
          checkPageBreak();
          this.addContentSection('6). ACHIEVEMENTS', reportData.achievements);
        }

        if (reportData.recommendations) {
          checkPageBreak();
          this.addContentSection('7). RECOMMENDATIONS', reportData.recommendations);
        }

        if (reportData.conclusion) {
          checkPageBreak();
          this.addContentSection('8). CONCLUSION', reportData.conclusion);
        }

        // Handle supporting files
        if (reportData.supportingFiles && reportData.supportingFiles.length > 0) {
          checkPageBreak();
          const filesText = reportData.supportingFiles.map(file => 
            `${file.originalName || file.filename} (${this.formatFileSize(file.size)})`
          ).join('\n');
          this.addContentSection('9). SUPPORTING DOCUMENTS', filesText);
        }

        // Finalize PDF
        this.doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper function for file size formatting
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Function to generate PDF buffer directly (for HTTP response)
async function generateFinalInternshipReportPDF(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 60 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Helper function to add page border
      const addPageBorder = () => {
        doc
          .rect(20, 20, 612 - 40, 792 - 40)
          .lineWidth(2)
          .strokeColor('#000000')
          .stroke();
      };

      // Add border to title page
      addPageBorder();

      // ============= TITLE PAGE =============
      // University Header (centered, blue)
      doc
        .fontSize(24)
        .fillColor('#0066cc')
        .font('Helvetica-Bold')
        .text('COMSATS UNIVERSITY ISLAMABAD', { align: 'center' });
      
      doc
        .fontSize(18)
        .text('Wah Campus', { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc
        .fontSize(20)
        .text('Internship Portal', { align: 'center' });
      
      doc.moveDown(2);

      // Helper function to add title fields with exact positioning like weekly reports
      let currentY = 160;
      const addTitleField = (label, value) => {
        doc
          .fontSize(14)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(label, 60, currentY);
        
        doc
          .fontSize(14)
          .font('Helvetica')
          .text(value || 'N/A', 200, currentY);
        
        currentY += 25;
      };

      // Student Information - same layout as weekly reports
      addTitleField('Student Name :', reportData.student.name);
      addTitleField('Student Roll :', reportData.student.rollNo);
      addTitleField('Supervisor Name :', reportData.company.supervisor);
      addTitleField('Company Hired :', reportData.company.name);
      addTitleField('Department :', reportData.company.department);
      addTitleField('Position :', reportData.internship.title);

      // Report Title (centered) - same as weekly reports
      doc.moveDown(2);
      doc
        .fontSize(18)
        .fillColor('#0066cc')
        .font('Helvetica-Bold')
        .text('Final Internship Report', { align: 'center' });

      // ============= START NEW PAGE FOR CONTENT =============
      doc.addPage();
      addPageBorder(); // Add border to content page

      // Helper function for content sections - EXACT same as weekly reports
      const addContentSection = (title, content) => {
        // Bold section heading
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(title);
        
        // Add space between heading and content
        doc.moveDown(1.5);
        
        // Content text starting on the next line with proper indentation
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#000000')
          .text(content || 'N/A', {
            width: 612 - 2 * 60,
            align: 'justify',
            indent: 20 // Small indent for content
          });
        
        // Add spacing after section
        doc.moveDown(2.5);
      };

      // Helper function to check if we need a new page
      const checkPageBreak = () => {
        if (doc.y > 700) { // Near bottom of page
          doc.addPage();
          addPageBorder(); // Add border to new page
        }
      };

      // Helper function for file size
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      // Add content sections with proper page breaks and borders
      if (reportData.executiveSummary) {
        checkPageBreak();
        addContentSection('1). EXECUTIVE SUMMARY', reportData.executiveSummary);
      }

      if (reportData.companyOverview) {
        checkPageBreak();
        addContentSection('2). COMPANY OVERVIEW', reportData.companyOverview);
      }

      if (reportData.projectDescription) {
        checkPageBreak();
        addContentSection('3). PROJECT DESCRIPTION', reportData.projectDescription);
      }

      if (reportData.skillsLearned) {
        checkPageBreak();
        addContentSection('4). SKILLS LEARNED', reportData.skillsLearned);
      }

      if (reportData.challenges) {
        checkPageBreak();
        addContentSection('5). CHALLENGES FACED', reportData.challenges);
      }

      if (reportData.achievements) {
        checkPageBreak();
        addContentSection('6). ACHIEVEMENTS', reportData.achievements);
      }

      if (reportData.recommendations) {
        checkPageBreak();
        addContentSection('7). RECOMMENDATIONS', reportData.recommendations);
      }

      if (reportData.conclusion) {
        checkPageBreak();
        addContentSection('8). CONCLUSION', reportData.conclusion);
      }

      // Handle supporting files - same format as weekly reports
      if (reportData.supportingFiles && reportData.supportingFiles.length > 0) {
        checkPageBreak();
        const filesText = reportData.supportingFiles.map(file => 
          `${file.originalName || file.filename} (${formatFileSize(file.size)})`
        ).join('\n');
        addContentSection('9). SUPPORTING DOCUMENTS', filesText);
      }

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  SimpleFinalInternshipReportPDF,
  generateFinalInternshipReportPDF
};