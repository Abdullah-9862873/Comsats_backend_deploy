require('dotenv').config();
const mongoose = require('mongoose');
require('./models/Application');
require('./models/User');
require('./models/WeeklyReportEvent');
require('./models/WeeklyReport');

const Application = mongoose.model('Application');
const WeeklyReportEvent = mongoose.model('WeeklyReportEvent');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🔌 Connected to MongoDB');
    
    const studentId = '68bdc7b1f10a369214d40159'; // Student_6 ID
    console.log(`\n👤 Checking for Student_6: ${studentId}`);
    
    // Check different application query approaches
    console.log('\n--- Query 1: supervisorStatus: "approved" ---');
    const approvedBySupervisor = await Application.find({
      studentId,
      supervisorStatus: 'approved'
    }).populate('supervisorId', 'name email');
    
    console.log(`Found ${approvedBySupervisor.length} applications with supervisorStatus: 'approved':`);
    approvedBySupervisor.forEach(app => {
      console.log({
        id: app._id,
        supervisorId: app.supervisorId?._id,
        supervisorName: app.supervisorId?.name,
        supervisorStatus: app.supervisorStatus,
        status: app.status
      });
    });
    
    console.log('\n--- Query 2: status: "approved" ---');
    const approvedStatus = await Application.find({
      studentId,
      status: 'approved'
    }).populate('supervisorId', 'name email');
    
    console.log(`Found ${approvedStatus.length} applications with status: 'approved':`);
    approvedStatus.forEach(app => {
      console.log({
        id: app._id,
        supervisorId: app.supervisorId?._id,
        supervisorName: app.supervisorId?.name,
        supervisorStatus: app.supervisorStatus,
        status: app.status
      });
    });
    
    // Check all weekly report events
    console.log('\n--- All Weekly Report Events ---');
    const allEvents = await WeeklyReportEvent.find({}).populate('supervisorId', 'name');
    console.log(`Found ${allEvents.length} total weekly report events:`);
    allEvents.forEach(event => {
      console.log({
        id: event._id,
        title: event.title,
        weekNumber: event.weekNumber,
        supervisorId: event.supervisorId?._id,
        supervisorName: event.supervisorId?.name,
        status: event.status,
        dueDate: event.dueDate
      });
    });
    
    // Now try to replicate what the controller should return
    console.log('\n--- Controller Logic Simulation ---');
    
    // Use the same logic as the controller
    const approvedApplication = await Application.findOne({
      studentId: studentId,
      supervisorStatus: 'approved'
    }).populate('supervisorId', 'name email');
    
    if (!approvedApplication) {
      console.log('❌ No approved application found - this explains why no events are returned!');
    } else {
      console.log('✅ Found approved application:', {
        supervisorId: approvedApplication.supervisorId._id,
        supervisorName: approvedApplication.supervisorId.name
      });
      
      const events = await WeeklyReportEvent.find({
        supervisorId: approvedApplication.supervisorId._id,
        status: 'active'
      }).sort({ weekNumber: 1 });
      
      console.log(`📅 Found ${events.length} active events for this supervisor`);
      events.forEach(event => {
        console.log({
          id: event._id,
          title: event.title,
          weekNumber: event.weekNumber,
          status: event.status,
          dueDate: event.dueDate
        });
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
