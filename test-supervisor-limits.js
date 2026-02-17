const mongoose = require('mongoose');
const User = require('./models/User');
const { syncSupervisorStudentCounts, getSupervisorAvailability } = require('./utils/supervisorUtils');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@fypinternshipportal.n5hjckh.mongodb.net/fyp_internship_system')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testSupervisorLimits() {
  try {
    console.log('🧪 Testing Supervisor Limit System...\n');
    
    // 1. Find a supervisor
    const supervisor = await User.findOne({ role: 'supervisor' });
    
    if (!supervisor) {
      console.log('❌ No supervisors found in database');
      return;
    }
    
    console.log(`👨‍🏫 Testing with supervisor: ${supervisor.name}`);
    console.log(`📧 Email: ${supervisor.email}`);
    
    // 2. Check current status
    const availability = await getSupervisorAvailability(supervisor._id);
    console.log('\n📊 Current Supervisor Status:');
    console.log(`   Max Students: ${availability.maxStudents}`);
    console.log(`   Current Students: ${availability.currentStudents}`);
    console.log(`   Available Slots: ${availability.availableSlots}`);
    console.log(`   Utilization: ${availability.utilizationPercentage}%`);
    console.log(`   Available: ${availability.available ? '✅ Yes' : '❌ No (At Capacity)'}`);
    
    // 3. Sync student counts
    console.log('\n🔄 Syncing supervisor student counts...');
    const syncResult = await syncSupervisorStudentCounts();
    
    if (syncResult.success) {
      console.log('✅ Sync completed successfully');
      
      // Check status again after sync
      const newAvailability = await getSupervisorAvailability(supervisor._id);
      console.log('\n📊 Status After Sync:');
      console.log(`   Current Students: ${newAvailability.currentStudents}`);
      console.log(`   Available Slots: ${newAvailability.availableSlots}`);
      console.log(`   Available: ${newAvailability.available ? '✅ Yes' : '❌ No (At Capacity)'}`);
    } else {
      console.log('❌ Sync failed:', syncResult.error);
    }
    
    // 4. Test updating supervisor limit
    console.log('\n⚙️ Testing supervisor limit update...');
    const originalLimit = supervisor.supervisor?.maxStudents || 10;
    
    // Update limit to test
    await User.findByIdAndUpdate(supervisor._id, {
      'supervisor.maxStudents': 5 // Set a lower limit for testing
    });
    
    const testAvailability = await getSupervisorAvailability(supervisor._id);
    console.log(`   New limit set to: ${testAvailability.maxStudents}`);
    console.log(`   Available: ${testAvailability.available ? '✅ Yes' : '❌ No (At Capacity)'}`);
    
    // Restore original limit
    await User.findByIdAndUpdate(supervisor._id, {
      'supervisor.maxStudents': originalLimit
    });
    console.log(`   Restored original limit: ${originalLimit}`);
    
    console.log('\n🎉 Supervisor limit system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testSupervisorLimits();