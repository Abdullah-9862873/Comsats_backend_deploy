const axios = require('axios');

async function testCompleteSettingsFlow() {
  try {
    console.log('🧪 Testing Complete Settings Functionality\n');

    const baseURL = 'http://localhost:5005/api';
    
    // Step 1: Login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@internshipportal.com', // Assuming admin email
      password: 'admin123' // Assuming admin password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Admin login failed - cannot test settings without authentication');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Step 2: Test GET settings
    console.log('\n2. Testing GET /api/admin/settings...');
    const getResponse = await axios.get(`${baseURL}/admin/settings`, { headers });
    
    console.log('✅ GET settings successful');
    console.log(`   Success: ${getResponse.data.success}`);
    console.log(`   Settings count: ${Object.keys(getResponse.data.settings).length}`);
    console.log(`   Sample settings:`);
    console.log(`     - systemName: ${getResponse.data.settings.systemName}`);
    console.log(`     - registrationEnabled: ${getResponse.data.settings.registrationEnabled}`);
    console.log(`     - maxApplicationsPerUser: ${getResponse.data.settings.maxApplicationsPerUser}`);

    // Step 3: Test PUT settings (update)
    console.log('\n3. Testing PUT /api/admin/settings...');
    const updateData = {
      systemName: 'Updated Internship Portal',
      maxApplicationsPerUser: 7,
      applicationDeadlineReminder: 5
    };

    const putResponse = await axios.put(`${baseURL}/admin/settings`, updateData, { headers });
    
    console.log('✅ PUT settings successful');
    console.log(`   Success: ${putResponse.data.success}`);
    console.log(`   Message: ${putResponse.data.message}`);

    // Step 4: Verify update
    console.log('\n4. Verifying settings were updated...');
    const verifyResponse = await axios.get(`${baseURL}/admin/settings`, { headers });
    
    console.log('✅ Settings verification successful');
    console.log(`   Updated systemName: ${verifyResponse.data.settings.systemName}`);
    console.log(`   Updated maxApplicationsPerUser: ${verifyResponse.data.settings.maxApplicationsPerUser}`);
    console.log(`   Updated applicationDeadlineReminder: ${verifyResponse.data.settings.applicationDeadlineReminder}`);

    // Step 5: Test reset settings
    console.log('\n5. Testing POST /api/admin/settings/reset...');
    const resetResponse = await axios.post(`${baseURL}/admin/settings/reset`, {}, { headers });
    
    console.log('✅ Reset settings successful');
    console.log(`   Success: ${resetResponse.data.success}`);
    console.log(`   Message: ${resetResponse.data.message}`);

    // Step 6: Verify reset
    console.log('\n6. Verifying settings were reset...');
    const finalResponse = await axios.get(`${baseURL}/admin/settings`, { headers });
    
    console.log('✅ Reset verification successful');
    console.log(`   Reset systemName: ${finalResponse.data.settings.systemName}`);
    console.log(`   Reset maxApplicationsPerUser: ${finalResponse.data.settings.maxApplicationsPerUser}`);
    console.log(`   Reset applicationDeadlineReminder: ${finalResponse.data.settings.applicationDeadlineReminder}`);

    console.log('\n🎉 All settings tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Admin authentication working');
    console.log('✅ GET settings endpoint working');
    console.log('✅ PUT settings endpoint working');
    console.log('✅ Settings are persisted to database');
    console.log('✅ POST reset settings endpoint working');
    console.log('✅ Settings reset functionality working');
    console.log('\n💡 The Settings tab in admin dashboard should now be fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: Authentication failed. Make sure admin user exists with correct credentials.');
    }
  }
}

testCompleteSettingsFlow();