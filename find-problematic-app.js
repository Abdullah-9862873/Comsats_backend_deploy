const mongoose = require('mongoose');

async function findProblematicApp() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });
    
    const Application = require('./models/Application');
    
    // Find the application that has applicationStatus 'hired' but NOT overallStatus 'approved'
    const problematicApps = await Application.find({
      applicationStatus: 'hired',
      overallStatus: { $ne: 'approved' }
    });
    
    console.log(`\n🔍 Found ${problematicApps.length} problematic application(s):`);
    
    problematicApps.forEach(app => {
      console.log(`\n📋 Application ID: ${app._id}`);
      console.log(`   Company ID: ${app.companyId}`);
      console.log(`   Student ID: ${app.studentId}`);
      console.log(`   Job ID: ${app.jobId}`);
      console.log(`   Overall Status: ${app.overallStatus || 'undefined'}`);
      console.log(`   Application Status: ${app.applicationStatus}`);
      console.log(`   Supervisor Status: ${app.supervisorStatus || 'undefined'}`);
      console.log(`   Company Status: ${app.companyStatus || 'undefined'}`);
      console.log(`   Hiring Date: ${app.hiringDate || 'undefined'}`);
      console.log(`   Created At: ${app.createdAt}`);
      console.log(`   Updated At: ${app.updatedAt}`);
    });
    
    // Also check if there are applications that should be hired but missing overallStatus
    const shouldBeHiredApps = await Application.find({
      applicationStatus: 'hired'
    }).populate('companyId', 'email').populate('studentId', 'name email');
    
    console.log(`\n📊 Summary of all hired applications by company:`);
    const companyStats = {};
    
    shouldBeHiredApps.forEach(app => {
      const companyEmail = app.companyId?.email || 'Unknown Company';
      if (!companyStats[companyEmail]) {
        companyStats[companyEmail] = { total: 0, withApproved: 0, withoutApproved: 0 };
      }
      companyStats[companyEmail].total++;
      
      if (app.overallStatus === 'approved') {
        companyStats[companyEmail].withApproved++;
      } else {
        companyStats[companyEmail].withoutApproved++;
      }
    });
    
    Object.entries(companyStats).forEach(([company, stats]) => {
      console.log(`   ${company}: ${stats.total} hired (${stats.withApproved} visible in evaluation, ${stats.withoutApproved} missing)`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Analysis complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findProblematicApp();
