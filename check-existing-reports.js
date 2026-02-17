const mongoose = require('mongoose');
require('dotenv').config();

// Models
const WeeklyReport = require('./models/WeeklyReport');

async function checkExistingReports() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const reports = await WeeklyReport.find({}).select('_id studentName weekNumber tasksCompleted challengesFaced reflections plansForNextWeek supportingMaterials status createdAt').limit(5);
    
    console.log(`Found ${reports.length} weekly reports:`);
    
    reports.forEach(report => {
      console.log('\n📋 Report:', report._id);
      console.log('Student:', report.studentName);
      console.log('Week:', report.weekNumber);
      console.log('Status:', report.status);
      console.log('Tasks Length:', report.tasksCompleted?.length || 0, '- Content:', report.tasksCompleted?.substring(0, 50) + '...');
      console.log('Challenges Length:', report.challengesFaced?.length || 0, '- Content:', report.challengesFaced?.substring(0, 50) + '...');
      console.log('Reflections Length:', report.reflections?.length || 0, '- Content:', report.reflections?.substring(0, 50) + '...');
      console.log('Plans Length:', report.plansForNextWeek?.length || 0, '- Content:', report.plansForNextWeek?.substring(0, 50) + '...');
      console.log('Materials Length:', report.supportingMaterials?.length || 0, '- Content:', report.supportingMaterials?.substring(0, 50) + '...');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkExistingReports();
