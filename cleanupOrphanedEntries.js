const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanupOrphanedEntries() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    const Student = require('./models/Student');
    
    // Find all students with file uploads
    const students = await Student.find({
      $or: [
        { 'cv.path': { $exists: true, $ne: null } },
        { 'certificates.0': { $exists: true } },
        { profilePicture: { $exists: true, $ne: null } }
      ]
    });

    console.log(`🔍 Found ${students.length} students with uploaded files`);
    let cleanedCount = 0;

    for (const student of students) {
      let needsUpdate = false;
      
      console.log(`\n👤 Checking: ${student.fullName} (${student.email})`);
      
      // Check CV
      if (student.cv && student.cv.path) {
        const cvPath = path.join(__dirname, student.cv.path);
        if (!fs.existsSync(cvPath)) {
          console.log(`  ❌ Removing missing CV reference: ${student.cv.path}`);
          student.cv = {
            filename: null,
            originalName: null,
            path: null,
            size: null,
            uploadedAt: null
          };
          needsUpdate = true;
        } else {
          console.log(`  ✅ CV exists: ${student.cv.path}`);
        }
      }

      // Check certificates
      if (student.certificates && student.certificates.length > 0) {
        const validCertificates = [];
        for (const cert of student.certificates) {
          const certPath = path.join(__dirname, cert.path);
          if (fs.existsSync(certPath)) {
            validCertificates.push(cert);
            console.log(`  ✅ Certificate exists: ${cert.path}`);
          } else {
            console.log(`  ❌ Removing missing certificate reference: ${cert.path}`);
            needsUpdate = true;
          }
        }
        if (validCertificates.length !== student.certificates.length) {
          student.certificates = validCertificates;
        }
      }

      // Check profile picture
      if (student.profilePicture) {
        const profilePath = path.join(__dirname, student.profilePicture);
        if (!fs.existsSync(profilePath)) {
          console.log(`  ❌ Removing missing profile picture reference: ${student.profilePicture}`);
          student.profilePicture = null;
          needsUpdate = true;
        } else {
          console.log(`  ✅ Profile picture exists: ${student.profilePicture}`);
        }
      }

      // Save if changes were made
      if (needsUpdate) {
        await student.save();
        cleanedCount++;
        console.log(`  💾 Updated student record`);
      }
    }

    console.log(`\n🧹 Cleanup complete! Updated ${cleanedCount} student records.`);
    
    // Show summary of remaining files
    console.log('\n📊 Current file status:');
    const uploadsDir = path.join(__dirname, 'uploads');
    const fileDirs = ['cvs', 'certificates', 'profiles'];
    
    for (const dir of fileDirs) {
      const dirPath = path.join(uploadsDir, dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        console.log(`${dir}: ${files.length} files`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run cleanup
cleanupOrphanedEntries();
