const mongoose = require('mongoose');

async function fixProblematicApp() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });
    
    const Application = require('./models/Application');
    
    console.log('🔧 Fixing the problematic application...');
    
    // Fix the specific problematic application
    const result = await Application.updateOne(
      {
        _id: '68c1699e6909d193253ba6d7'
      },
      {
        $set: {
          overallStatus: 'approved',
          companyStatus: 'approved'
        }
      }
    );
    
    console.log(`✅ Fixed application: ${result.modifiedCount} document(s) updated`);
    
    // Also fix any other applications that might have the same issue
    const bulkResult = await Application.updateMany(
      {
        applicationStatus: 'hired',
        overallStatus: { $ne: 'approved' }
      },
      {
        $set: {
          overallStatus: 'approved',
          companyStatus: 'approved'
        }
      }
    );
    
    console.log(`🔧 Bulk fix for all similar cases: ${bulkResult.modifiedCount} document(s) updated`);
    
    // Verify the fix
    const verifyResult = await Application.find({
      applicationStatus: 'hired',
      overallStatus: { $ne: 'approved' }
    });
    
    console.log(`\n✅ Verification: ${verifyResult.length} problematic applications remaining`);
    
    // Check total counts now
    const approvedApps = await Application.countDocuments({overallStatus: 'approved'});
    const hiredApps = await Application.countDocuments({applicationStatus: 'hired'});
    const bothApps = await Application.countDocuments({
      overallStatus: 'approved',
      applicationStatus: 'hired'
    });
    
    console.log(`\n📊 Final status:`)
    console.log(`   Applications with overallStatus 'approved': ${approvedApps}`);
    console.log(`   Applications with applicationStatus 'hired': ${hiredApps}`);
    console.log(`   Applications with BOTH: ${bothApps}`);
    console.log(`   🎯 All hired students should now be visible in evaluation tabs!`);
    
    await mongoose.disconnect();
    console.log('\n✅ Fix complete and verified');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixProblematicApp();
