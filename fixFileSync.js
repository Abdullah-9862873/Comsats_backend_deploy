#!/usr/bin/env node

/**
 * Comprehensive Fix Script for CV and Certificate Download Issues
 * 
 * This script:
 * 1. Checks database for orphaned file references
 * 2. Cleans up invalid file references
 * 3. Validates file system integrity
 * 4. Tests the API endpoints
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch').default || require('node-fetch');
require('dotenv').config();

class FileSyncFixer {
  constructor() {
    this.stats = {
      studentsChecked: 0,
      orphanedReferences: 0,
      fixedReferences: 0,
      errors: []
    };
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      return false;
    }
  }

  async checkFileSystemIntegrity() {
    console.log('\n🔍 Checking file system integrity...');
    
    const uploadsPath = path.join(__dirname, 'uploads');
    const directories = ['cvs', 'certificates', 'profiles'];
    
    for (const dir of directories) {
      const dirPath = path.join(uploadsPath, dir);
      if (!fs.existsSync(dirPath)) {
        console.log(`📁 Creating missing directory: ${dir}`);
        fs.mkdirSync(dirPath, { recursive: true });
      } else {
        const files = fs.readdirSync(dirPath);
        console.log(`📁 ${dir}: ${files.length} files`);
      }
    }
  }

  async cleanupDatabase() {
    console.log('\n🧹 Cleaning up database references...');
    
    const Student = require('./models/Student');
    
    const students = await Student.find({
      $or: [
        { 'cv.path': { $exists: true, $ne: null } },
        { 'certificates.0': { $exists: true } },
        { profilePicture: { $exists: true, $ne: null } }
      ]
    });

    console.log(`👥 Found ${students.length} students with file uploads`);
    this.stats.studentsChecked = students.length;

    for (const student of students) {
      let needsUpdate = false;
      const issues = [];
      
      // Check CV
      if (student.cv && student.cv.path) {
        const cvPath = path.join(__dirname, student.cv.path);
        if (!fs.existsSync(cvPath)) {
          issues.push(`Missing CV: ${student.cv.path}`);
          student.cv = undefined;
          needsUpdate = true;
          this.stats.orphanedReferences++;
        }
      }

      // Check certificates
      if (student.certificates && student.certificates.length > 0) {
        const validCertificates = [];
        for (const cert of student.certificates) {
          const certPath = path.join(__dirname, cert.path);
          if (fs.existsSync(certPath)) {
            validCertificates.push(cert);
          } else {
            issues.push(`Missing Certificate: ${cert.path}`);
            this.stats.orphanedReferences++;
          }
        }
        if (validCertificates.length !== student.certificates.length) {
          student.certificates = validCertificates;
          needsUpdate = true;
        }
      }

      // Check profile picture
      if (student.profilePicture) {
        const profilePath = path.join(__dirname, student.profilePicture);
        if (!fs.existsSync(profilePath)) {
          issues.push(`Missing Profile Picture: ${student.profilePicture}`);
          student.profilePicture = undefined;
          needsUpdate = true;
          this.stats.orphanedReferences++;
        }
      }

      // Save if changes were made
      if (needsUpdate) {
        try {
          await student.save();
          this.stats.fixedReferences++;
          console.log(`✅ Fixed ${student.fullName} (${student.email})`);
          if (issues.length > 0) {
            console.log(`   Issues fixed: ${issues.join(', ')}`);
          }
        } catch (error) {
          console.error(`❌ Error updating ${student.fullName}:`, error.message);
          this.stats.errors.push(`${student.fullName}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${student.fullName} - All files valid`);
      }
    }
  }

  async testAPIEndpoints() {
    console.log('\n🌐 Testing API endpoints...');
    
    const baseUrl = `http://localhost:${process.env.PORT || 5002}`;
    
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) {
        console.log('✅ Health endpoint working');
      } else {
        console.log('❌ Health endpoint failed');
      }

      // Test file debug endpoint
      const debugResponse = await fetch(`${baseUrl}/debug/files`);
      if (debugResponse.ok) {
        const data = await debugResponse.json();
        console.log('✅ File debug endpoint working');
        console.log('📊 Current files:', data.files);
      } else {
        console.log('❌ File debug endpoint failed');
      }

      // Test static file serving
      const uploadsPath = path.join(__dirname, 'uploads', 'cvs');
      if (fs.existsSync(uploadsPath)) {
        const files = fs.readdirSync(uploadsPath);
        if (files.length > 0) {
          const testFile = files[0];
          const fileUrl = `${baseUrl}/uploads/cvs/${testFile}`;
          const fileResponse = await fetch(fileUrl, { method: 'HEAD' });
          if (fileResponse.ok) {
            console.log(`✅ Static file serving working (tested: ${testFile})`);
          } else {
            console.log(`❌ Static file serving failed (tested: ${testFile})`);
          }
        }
      }

    } catch (error) {
      console.log('❌ API testing failed:', error.message);
      console.log('💡 Make sure the server is running on port', process.env.PORT || 5002);
    }
  }

  printSummary() {
    console.log('\n📋 SUMMARY:');
    console.log(`👥 Students checked: ${this.stats.studentsChecked}`);
    console.log(`🗑️  Orphaned references found: ${this.stats.orphanedReferences}`);
    console.log(`✅ References fixed: ${this.stats.fixedReferences}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.stats.fixedReferences > 0) {
      console.log('\n🎉 Database cleanup completed successfully!');
      console.log('💡 Restart your frontend application to see the changes.');
    } else {
      console.log('\n✨ No issues found - everything looks good!');
    }
  }

  async run() {
    console.log('🚀 Starting comprehensive file sync fix...\n');
    
    if (!(await this.connect())) {
      return;
    }

    try {
      await this.checkFileSystemIntegrity();
      await this.cleanupDatabase();
      await this.testAPIEndpoints();
    } catch (error) {
      console.error('❌ Critical error:', error);
      this.stats.errors.push(`Critical: ${error.message}`);
    } finally {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
      this.printSummary();
    }
  }
}

// Run the fixer
const fixer = new FileSyncFixer();
fixer.run().catch(console.error);
