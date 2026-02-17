const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import Student model
const Student = require('./models/Student');

async function checkFileSystemSync() {
  console.log('🔍 Checking database and file system synchronization...\n');
  
  try {
    // Get all students with file uploads
    const students = await Student.find({
      $or: [
        { 'cv.path': { $exists: true, $ne: null } },
        { 'certificates.0': { $exists: true } },
        { profilePicture: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${students.length} students with uploaded files\n`);

    let orphanedFiles = [];
    let missingFiles = [];

    for (const student of students) {
      console.log(`Checking student: ${student.fullName} (${student.email})`);
      
      // Check CV
      if (student.cv && student.cv.path) {
        const cvPath = path.join(__dirname, student.cv.path);
        if (!fs.existsSync(cvPath)) {
          missingFiles.push({
            studentId: student._id,
            studentName: student.fullName,
            fileType: 'CV',
            expectedPath: student.cv.path,
            fileName: student.cv.filename
          });
          console.log(`  ❌ Missing CV: ${student.cv.path}`);
        } else {
          console.log(`  ✅ CV exists: ${student.cv.path}`);
        }
      }

      // Check certificates
      if (student.certificates && student.certificates.length > 0) {
        for (const cert of student.certificates) {
          const certPath = path.join(__dirname, cert.path);
          if (!fs.existsSync(certPath)) {
            missingFiles.push({
              studentId: student._id,
              studentName: student.fullName,
              fileType: 'Certificate',
              expectedPath: cert.path,
              fileName: cert.filename
            });
            console.log(`  ❌ Missing Certificate: ${cert.path}`);
          } else {
            console.log(`  ✅ Certificate exists: ${cert.path}`);
          }
        }
      }

      // Check profile picture
      if (student.profilePicture) {
        const profilePath = path.join(__dirname, student.profilePicture);
        if (!fs.existsSync(profilePath)) {
          missingFiles.push({
            studentId: student._id,
            studentName: student.fullName,
            fileType: 'Profile Picture',
            expectedPath: student.profilePicture,
            fileName: path.basename(student.profilePicture)
          });
          console.log(`  ❌ Missing Profile Picture: ${student.profilePicture}`);
        } else {
          console.log(`  ✅ Profile Picture exists: ${student.profilePicture}`);
        }
      }
      
      console.log('');
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total students with files: ${students.length}`);
    console.log(`Missing files: ${missingFiles.length}`);
    
    if (missingFiles.length > 0) {
      console.log('\n❌ Missing Files:');
      missingFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.fileType} for ${file.studentName}`);
        console.log(`   Expected: ${file.expectedPath}`);
        console.log(`   Filename: ${file.fileName}`);
        console.log('');
      });
    }

    // Check for orphaned files in filesystem
    console.log('\n🗂️  Checking for orphaned files in filesystem...');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    const fileDirs = ['cvs', 'certificates', 'profiles'];
    
    for (const dir of fileDirs) {
      const dirPath = path.join(uploadsDir, dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        console.log(`\n${dir.toUpperCase()} directory has ${files.length} files:`);
        
        for (const file of files) {
          const filePath = `uploads/${dir}/${file}`;
          // Check if this file is referenced in database
          const isReferenced = students.some(student => {
            if (dir === 'cvs' && student.cv && student.cv.path === filePath) return true;
            if (dir === 'certificates' && student.certificates.some(cert => cert.path === filePath)) return true;
            if (dir === 'profiles' && student.profilePicture === filePath) return true;
            return false;
          });
          
          if (!isReferenced) {
            orphanedFiles.push({ dir, file, path: filePath });
            console.log(`  🗑️  Orphaned: ${file}`);
          } else {
            console.log(`  ✅ Referenced: ${file}`);
          }
        }
      }
    }

    if (orphanedFiles.length > 0) {
      console.log(`\n🗑️  Found ${orphanedFiles.length} orphaned files that could be cleaned up.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFileSystemSync();
