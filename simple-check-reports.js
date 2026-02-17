// Simple script to see weekly report schema and recent submissions
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkReports() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db('fyp_internship_system');
    const collection = db.collection('weeklyreports');
    
    // Count total reports
    const count = await collection.countDocuments();
    console.log(`📊 Total weekly reports: ${count}`);
    
    // Get latest reports
    const reports = await collection.find({}).sort({ createdAt: -1 }).limit(3).toArray();
    
    console.log('\n📋 Latest reports:');
    reports.forEach((report, index) => {
      console.log(`\n${index + 1}. Report ID: ${report._id}`);
      console.log(`   Student: ${report.studentName}`);
      console.log(`   Week: ${report.weekNumber}`);
      console.log(`   Status: ${report.status}`);
      console.log(`   Tasks: "${report.tasksCompleted}" (${report.tasksCompleted?.length || 0} chars)`);
      console.log(`   Challenges: "${report.challengesFaced}" (${report.challengesFaced?.length || 0} chars)`);
      console.log(`   Reflections: "${report.reflections}" (${report.reflections?.length || 0} chars)`);
      console.log(`   Plans: "${report.plansForNextWeek}" (${report.plansForNextWeek?.length || 0} chars)`);
      console.log(`   Materials: "${report.supportingMaterials}" (${report.supportingMaterials?.length || 0} chars)`);
      console.log(`   Created: ${report.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkReports();
