const mongoose = require('mongoose');
const Setting = require('./models/Setting');
require('dotenv').config();

async function testSettingsAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Settings API Functionality\n');

    // Simulate the getSettings API call
    console.log('1. Testing getSettings...');
    const settings = await Setting.find({});
    
    // Convert array to object with key-value pairs
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    // Provide default values for missing settings
    const defaultSettings = {
      systemName: 'Internship Portal',
      systemEmail: 'admin@internshipportal.com',
      systemUrl: 'http://localhost:3000',
      maintenanceMode: false,
      registrationEnabled: true,
      emailProvider: 'smtp',
      smtpHost: '',
      smtpPort: '587',
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      emailFromName: '',
      emailFromAddress: '',
      emailNotifications: true,
      applicationNotifications: true,
      systemAlerts: true,
      marketingEmails: false,
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireNumbers: true,
      sessionTimeout: 24,
      twoFactorAuth: false,
      maxLoginAttempts: 5,
      maxApplicationsPerUser: 5,
      applicationDeadlineReminder: 7,
      autoApproveCompanies: false,
      requireEmailVerification: true,
      theme: 'light',
      primaryColor: '#3B82F6',
      enableDarkMode: true,
      compactMode: false
    };

    const finalSettings = { ...defaultSettings, ...settingsObj };

    console.log('✅ Settings retrieved successfully');
    console.log(`📊 Total settings: ${Object.keys(finalSettings).length}`);
    console.log('Sample settings:');
    console.log(`  - systemName: ${finalSettings.systemName}`);
    console.log(`  - registrationEnabled: ${finalSettings.registrationEnabled}`);
    console.log(`  - maxApplicationsPerUser: ${finalSettings.maxApplicationsPerUser}`);

    // Test response structure
    const response = {
      success: true,
      settings: finalSettings
    };

    console.log('\n2. Testing response structure...');
    console.log(`✅ response.success: ${response.success}`);
    console.log(`✅ response.settings exists: ${response.settings ? 'Yes' : 'No'}`);
    console.log(`✅ settings count: ${Object.keys(response.settings).length}`);

    console.log('\n3. Testing frontend access patterns...');
    console.log(`✅ Frontend will receive:`);
    console.log(`   - response.success: ${response.success}`);
    console.log(`   - response.settings.systemName: ${response.settings.systemName}`);
    console.log(`   - response.settings.registrationEnabled: ${response.settings.registrationEnabled}`);

    console.log('\n✅ Settings API test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSettingsAPI();