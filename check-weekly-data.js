const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://Abdullah:asdf@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// WeeklyReport model (basic schema)
const WeeklyReport = mongoose.model('WeeklyReport', new mongoose.Schema({}, { strict: false }));

const checkWeeklyReports = async () => {
  await connectDB();
  
  try {
    const reports = await WeeklyReport.find({}).limit(5);
    console.log('📊 Found weekly reports:', reports.length);
    
    reports.forEach((report, index) => {
      console.log(`\n📝 Report ${index + 1}:`);
      console.log('ID:', report._id);
      console.log('Student:', report.studentName);
      console.log('Week:', report.weekNumber);
      console.log('Tasks Completed:', report.tasksCompleted || 'MISSING');
      console.log('Challenges Faced:', report.challengesFaced || 'MISSING');
      console.log('Reflections:', report.reflections || 'MISSING');
      console.log('Plans for Next Week:', report.plansForNextWeek || 'MISSING');
      console.log('Supporting Materials:', report.supportingMaterials || 'MISSING');
      console.log('Status:', report.status);
      console.log('Created:', report.createdAt);
    });
    
  } catch (error) {
    console.error('❌ Error checking reports:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkWeeklyReports();
