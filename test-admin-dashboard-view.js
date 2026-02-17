const mongoose = require('mongoose');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');

const mongoURI = 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';

async function testAdminDashboardView() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Testing Admin Dashboard Company View\n');

    // Simulate admin dashboard company fetch (same as adminController.js)
    const companies = await CompanyProfile.find()
      .populate('user', 'name email createdAt isVerified')
      .sort({ createdAt: -1 });

    console.log(`🏢 Total companies for admin review: ${companies.length}\n`);

    if (companies.length > 0) {
      companies.forEach((company, index) => {
        console.log(`📋 Company ${index + 1} - Admin Dashboard View:`);
        console.log('   ==========================================');
        console.log(`   🏢 Company Name: ${company.companyName}`);
        console.log(`   🏭 Industry: ${company.industry || 'Not specified'}`);
        console.log(`   🌐 Website: ${company.website || 'Not specified'}`);
        console.log(`   📝 About: ${company.about || 'Not specified'}`);
        console.log(`   📊 Status: ${company.status.toUpperCase()}`);
        console.log('   ==========================================');
        console.log(`   👤 User Details:`);
        console.log(`      - Name: ${company.user?.name || 'N/A'}`);
        console.log(`      - Email: ${company.user?.email || 'N/A'}`);
        console.log(`      - Email Verified: ${company.user?.isVerified ? 'YES' : 'NO'}`);
        console.log(`      - Registered: ${company.user?.createdAt || 'N/A'}`);
        console.log('');

        // Show what admin actions are available
        console.log(`   🎛️ Admin Actions Available:`);
        if (company.status === 'pending') {
          console.log(`      ✅ APPROVE - Allow company to login`);
          console.log(`      ❌ REJECT - Block company from logging in`);
        } else if (company.status === 'approved') {
          console.log(`      ❌ REJECT - Revoke company access`);
        } else if (company.status === 'rejected') {
          console.log(`      ✅ APPROVE - Restore company access`);
        }
        console.log('   ==========================================\n');
      });

      // Show summary for admin
      const statusSummary = companies.reduce((acc, company) => {
        acc[company.status] = (acc[company.status] || 0) + 1;
        return acc;
      }, {});

      console.log('📈 Admin Dashboard Summary:');
      console.log('   ==========================================');
      Object.entries(statusSummary).forEach(([status, count]) => {
        const icon = status === 'pending' ? '⏳' : status === 'approved' ? '✅' : '❌';
        console.log(`   ${icon} ${status.toUpperCase()}: ${count} companies`);
      });
      console.log('   ==========================================\n');

      console.log('💡 Admin Workflow:');
      console.log('   1. New companies register with detailed information');
      console.log('   2. Admin sees all company details in dashboard');
      console.log('   3. Admin can VIEW company information');
      console.log('   4. Admin can APPROVE companies (allows login)');
      console.log('   5. Admin can REJECT companies (blocks login)');
      console.log('   6. Companies get proper login messages based on status');

    } else {
      console.log('ℹ️ No companies found. Register a new company to test the workflow.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

testAdminDashboardView();