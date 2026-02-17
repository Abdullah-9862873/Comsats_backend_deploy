require('dotenv').config();
const mongoose = require('mongoose');
const ProgressReport = require('./models/ProgressReport');
const InternshipAppraisal = require('./models/InternshipAppraisal');
const MisconductReport = require('./models/MisconductReport');
const Student = require('./models/Student');

async function checkReportsStructure() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Check any Progress Report
    console.log('📊 Checking Progress Reports...');
    const progressReport = await ProgressReport.findOne().limit(1);
    if (progressReport) {
      console.log('Sample Progress Report:');
      console.log('   ID:', progressReport._id);
      console.log('   Student ID:', progressReport.studentId);
      console.log('   Company ID:', progressReport.companyId);
      console.log('   Status:', progressReport.status);
      console.log('   Fields:', Object.keys(progressReport.toObject()));
      console.log();
    } else {
      console.log('   No Progress Reports found');
      console.log();
    }

    // Check Student who has progress report
    if (progressReport) {
      console.log('🔍 Checking Student for this report...');
      const student = await Student.findById(progressReport.studentId);
      if (student) {
        console.log('   Student:', student.name);
        console.log('   Roll Number:', student.rollNumber);
        console.log('   Email:', student.email);
      } else {
        console.log('   ⚠️ Student not found with ID:', progressReport.studentId);
      }
      console.log();
    }

    // Check Misconduct Report
    console.log('📊 Checking Misconduct Reports...');
    const misconductReport = await MisconductReport.findOne().limit(1);
    if (misconductReport) {
      console.log('Sample Misconduct Report:');
      console.log('   ID:', misconductReport._id);
      console.log('   Student ID:', misconductReport.studentId);
      console.log('   Company ID:', misconductReport.companyId);
      console.log('   Status:', misconductReport.status);
      console.log('   Fields:', Object.keys(misconductReport.toObject()));
      console.log();
    } else {
      console.log('   No Misconduct Reports found');
      console.log();
    }

    // Check Internship Appraisal
    console.log('📊 Checking Internship Appraisals...');
    const appraisal = await InternshipAppraisal.findOne().limit(1);
    if (appraisal) {
      console.log('Sample Internship Appraisal:');
      console.log('   ID:', appraisal._id);
      console.log('   Student ID:', appraisal.studentId);
      console.log('   Company ID:', appraisal.companyId);
      console.log('   Status:', appraisal.status);
      console.log('   Fields:', Object.keys(appraisal.toObject()));
      console.log();
    } else {
      console.log('   No Internship Appraisals found');
      console.log();
    }

    console.log('✅ Check Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkReportsStructure();
