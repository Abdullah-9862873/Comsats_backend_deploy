const mongoose = require('mongoose');
require('./models/Application');
require('./models/User');
const Application = mongoose.model('Application');

mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('🔌 Connected to MongoDB');
    
    // Check application structure for Student_6
    const studentId = '68bdc7b1f10a369214d40159'; // Student_6 ID
    
    console.log(`\n📋 Looking for applications for student: ${studentId}`);
    
    // Check with different query conditions
    const allApplications = await Application.find({ studentId }).populate('supervisorId', 'name email');
    console.log(`\n📄 All applications for student (${allApplications.length}):`);
    allApplications.forEach(app => {
      console.log({
        id: app._id,
        studentId: app.studentId,
        supervisorId: app.supervisorId?._id,
        supervisorName: app.supervisorId?.name,
        status: app.status,
        supervisorStatus: app.supervisorStatus,
        adminStatus: app.adminStatus
      });
    });
    
    // Check specifically for supervisorStatus: 'approved'
    const approvedBySupervisor = await Application.find({
      studentId,
      supervisorStatus: 'approved'
    }).populate('supervisorId', 'name email');
    
    console.log(`\n✅ Applications with supervisorStatus: 'approved' (${approvedBySupervisor.length}):`);
    approvedBySupervisor.forEach(app => {
      console.log({
        id: app._id,
        studentId: app.studentId,
        supervisorId: app.supervisorId?._id,
        supervisorName: app.supervisorId?.name,
        status: app.status,
        supervisorStatus: app.supervisorStatus,
        adminStatus: app.adminStatus
      });
    });
    
    // Check for status: 'approved'
    const approvedStatus = await Application.find({
      studentId,
      status: 'approved'
    }).populate('supervisorId', 'name email');
    
    console.log(`\n🎯 Applications with status: 'approved' (${approvedStatus.length}):`);
    approvedStatus.forEach(app => {
      console.log({
        id: app._id,
        studentId: app.studentId,
        supervisorId: app.supervisorId?._id,
        supervisorName: app.supervisorId?.name,
        status: app.status,
        supervisorStatus: app.supervisorStatus,
        adminStatus: app.adminStatus
      });
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
