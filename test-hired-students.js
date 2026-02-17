const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected for testing');
    testHiredStudents();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const testHiredStudents = async () => {
  try {
    // Load all models
    const Application = require('./models/Application');
    const OfferLetter = require('./models/OfferLetter');
    const User = require('./models/User');
    const Job = require('./models/Job');
    
    // Find hired applications
    const hiredApplications = await Application.find({
      isCurrentlyHired: true,
      overallStatus: 'approved'
    })
    .populate('studentId', 'name email student')
    .populate({
      path: 'jobId',
      select: 'title',
      populate: {
        path: 'companyId',
        select: 'name'
      }
    })
    .limit(5);
    
    console.log('\n=== HIRED APPLICATIONS TEST ===');
    console.log('Found hired applications:', hiredApplications.length);
    
    if (hiredApplications.length > 0) {
      console.log('\nFirst hired application:');
      console.log('Student:', hiredApplications[0].studentId?.name);
      console.log('Student Email:', hiredApplications[0].studentId?.email);
      console.log('Registration:', hiredApplications[0].studentId?.student?.regNo);
      console.log('Job Title:', hiredApplications[0].jobId?.title);
      console.log('Company:', hiredApplications[0].jobId?.companyId?.name);
      console.log('Start Date:', hiredApplications[0].startDate);
      console.log('End Date:', hiredApplications[0].endDate);
      console.log('Supervisor ID:', hiredApplications[0].supervisorId);
      
      // Check for offer letter
      const offerLetter = await OfferLetter.findOne({
        studentId: hiredApplications[0].studentId._id,
        jobId: hiredApplications[0].jobId._id,
        status: 'accepted'
      });
      
      console.log('\nOffer Letter Found:', offerLetter ? 'YES' : 'NO');
      if (offerLetter) {
        console.log('Offer Start Date:', offerLetter.startDate);
        console.log('Offer End Date:', offerLetter.endDate);
      }
    }
    
    // Test with specific supervisor
    console.log('\n=== SUPERVISOR SPECIFIC TEST ===');
    const supervisorId = '68ba833c1d183b72f00855d9'; // From the logs
    
    const supervisorHired = await Application.find({
      supervisorId,
      isCurrentlyHired: true,
      overallStatus: 'approved'
    })
    .populate('studentId', 'name email student')
    .populate({
      path: 'jobId',
      select: 'title',
      populate: {
        path: 'companyId',
        select: 'name'
      }
    });
    
    console.log('Hired students for supervisor:', supervisorHired.length);
    
    if (supervisorHired.length > 0) {
      supervisorHired.forEach((app, index) => {
        console.log(`${index + 1}. ${app.studentId?.name} - ${app.studentId?.student?.regNo}`);
      });
    } else {
      console.log('No hired students found for this supervisor');
      
      // Check all applications for this supervisor
      const allApps = await Application.find({ supervisorId })
        .populate('studentId', 'name')
        .limit(5);
      
      console.log('All applications for supervisor:', allApps.length);
      if (allApps.length > 0) {
        allApps.forEach((app, index) => {
          console.log(`${index + 1}. ${app.studentId?.name} - Status: ${app.overallStatus}, Hired: ${app.isCurrentlyHired}`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};
