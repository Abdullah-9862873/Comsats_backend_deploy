const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

async function cleanupOrphanedApplications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('=== CLEANING UP ORPHANED APPLICATIONS ===');
    
    // Find all applications
    const allApplications = await Application.find();
    console.log('Total applications:', allApplications.length);
    
    let orphanedCount = 0;
    let orphanedIds = [];
    
    for (const app of allApplications) {
      // Check if student exists
      const studentExists = await User.findById(app.studentId);
      
      if (!studentExists) {
        console.log(`Orphaned application found: ${app._id} (student ${app.studentId} not found)`);
        orphanedIds.push(app._id);
        orphanedCount++;
      }
    }
    
    console.log(`Found ${orphanedCount} orphaned applications`);
    
    if (orphanedCount > 0) {
      console.log('Deleting orphaned applications...');
      const result = await Application.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`Deleted ${result.deletedCount} orphaned applications`);
    }
    
    console.log('✅ Cleanup completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedApplications();