const mongoose = require('mongoose');
const Setting = require('./models/Setting');
require('dotenv').config();

async function createDefaultSettings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Default settings to create
    const defaultSettings = [
      {
        key: 'systemName',
        value: 'Internship Portal',
        type: 'string',
        description: 'Name of the system displayed in the interface',
        category: 'system'
      },
      {
        key: 'systemEmail',
        value: 'admin@internshipportal.com',
        type: 'string',
        description: 'System administrator email address',
        category: 'system'
      },
      {
        key: 'systemUrl',
        value: 'http://localhost:3000',
        type: 'string',
        description: 'Base URL of the application',
        category: 'system'
      },
      {
        key: 'maintenanceMode',
        value: false,
        type: 'boolean',
        description: 'Enable maintenance mode to prevent user access',
        category: 'system'
      },
      {
        key: 'registrationEnabled',
        value: true,
        type: 'boolean',
        description: 'Allow new user registrations',
        category: 'system'
      },
      {
        key: 'emailNotifications',
        value: true,
        type: 'boolean',
        description: 'Enable email notifications for users',
        category: 'notifications'
      },
      {
        key: 'applicationNotifications',
        value: true,
        type: 'boolean',
        description: 'Send notifications for application status changes',
        category: 'notifications'
      },
      {
        key: 'systemAlerts',
        value: true,
        type: 'boolean',
        description: 'Enable system-wide alert notifications',
        category: 'notifications'
      },
      {
        key: 'passwordMinLength',
        value: 8,
        type: 'number',
        description: 'Minimum password length for user accounts',
        category: 'security'
      },
      {
        key: 'requireSpecialChar',
        value: true,
        type: 'boolean',
        description: 'Require special characters in passwords',
        category: 'security'
      },
      {
        key: 'requireNumbers',
        value: true,
        type: 'boolean',
        description: 'Require numbers in passwords',
        category: 'security'
      },
      {
        key: 'sessionTimeout',
        value: 24,
        type: 'number',
        description: 'Session timeout in hours',
        category: 'security'
      },
      {
        key: 'maxApplicationsPerUser',
        value: 5,
        type: 'number',
        description: 'Maximum applications a student can submit',
        category: 'application'
      },
      {
        key: 'applicationDeadlineReminder',
        value: 7,
        type: 'number',
        description: 'Days before deadline to send reminder emails',
        category: 'application'
      },
      {
        key: 'autoApproveCompanies',
        value: false,
        type: 'boolean',
        description: 'Automatically approve company registrations',
        category: 'application'
      },
      {
        key: 'requireEmailVerification',
        value: true,
        type: 'boolean',
        description: 'Require email verification for new accounts',
        category: 'security'
      },
      {
        key: 'theme',
        value: 'light',
        type: 'string',
        description: 'Default theme for the application',
        category: 'ui'
      },
      {
        key: 'primaryColor',
        value: '#3B82F6',
        type: 'string',
        description: 'Primary color theme for the interface',
        category: 'ui'
      }
    ];

    console.log('\n🔧 Creating default settings...');

    for (const settingData of defaultSettings) {
      try {
        // Check if setting already exists
        const existingSetting = await Setting.findOne({ key: settingData.key });
        
        if (!existingSetting) {
          const setting = new Setting(settingData);
          await setting.save();
          console.log(`✅ Created setting: ${settingData.key} = ${settingData.value}`);
        } else {
          console.log(`⏭️  Setting already exists: ${settingData.key}`);
        }
      } catch (error) {
        console.error(`❌ Error creating setting ${settingData.key}:`, error.message);
      }
    }

    // Display all settings
    console.log('\n📋 Current Settings in Database:');
    const allSettings = await Setting.find({}).sort({ category: 1, key: 1 });
    
    let currentCategory = '';
    allSettings.forEach(setting => {
      if (setting.category !== currentCategory) {
        console.log(`\n--- ${setting.category.toUpperCase()} ---`);
        currentCategory = setting.category;
      }
      console.log(`${setting.key}: ${setting.value} (${setting.type})`);
    });

    console.log(`\n✅ Settings setup complete! Total settings: ${allSettings.length}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createDefaultSettings();