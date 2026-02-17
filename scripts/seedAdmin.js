/**
 * Admin User Seed Script
 * Creates an initial admin user and basic system settings
 * Run: node scripts/seedAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Setting = require('../models/Setting');
const BlockedDomain = require('../models/BlockedDomain');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Create Admin User
 */
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@comsats.edu.pk',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff',
      createdAt: new Date()
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@comsats.edu.pk');
    console.log('🔑 Password: Admin@123');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

/**
 * Create Default System Settings
 */
const createDefaultSettings = async () => {
  try {
    const defaultSettings = [
      {
        key: 'EMAIL_VERIFICATION_REQUIRED',
        value: true,
        type: 'boolean',
        description: 'Require email verification for new users',
        category: 'email'
      },
      {
        key: 'MAX_APPLICATIONS_PER_STUDENT',
        value: 5,
        type: 'number',
        description: 'Maximum number of applications a student can submit',
        category: 'application'
      },
      {
        key: 'COMPANY_APPROVAL_REQUIRED',
        value: true,
        type: 'boolean',
        description: 'Require admin approval for company registrations',
        category: 'general'
      },
      {
        key: 'INTERNSHIP_DURATION_WEEKS',
        value: 12,
        type: 'number',
        description: 'Default internship duration in weeks',
        category: 'general'
      },
      {
        key: 'SUPERVISOR_MAX_STUDENTS',
        value: 10,
        type: 'number',
        description: 'Maximum students per supervisor',
        category: 'supervision'
      },
      {
        key: 'WEEKLY_REPORT_DEADLINE',
        value: 'Friday',
        type: 'string',
        description: 'Day of the week for weekly report submissions',
        category: 'reports'
      },
      {
        key: 'SYSTEM_MAINTENANCE_MODE',
        value: false,
        type: 'boolean',
        description: 'Enable maintenance mode to restrict access',
        category: 'system'
      },
      {
        key: 'EMAIL_NOTIFICATION_ENABLED',
        value: true,
        type: 'boolean',
        description: 'Enable automatic email notifications',
        category: 'email'
      }
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await Setting.findOne({ key: setting.key });
      if (!existingSetting) {
        await Setting.create(setting);
        console.log(`✅ Created setting: ${setting.key}`);
      }
    }

    console.log('✅ Default settings created/verified');
  } catch (error) {
    console.error('❌ Error creating default settings:', error);
    throw error;
  }
};

/**
 * Create Default Blocked Domains
 */
const createDefaultBlockedDomains = async (adminUserId) => {
  try {
    const blockedDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'maildrop.cc',
      'temp-mail.org',
      'throwaway.email',
      'getnada.com',
      'mohmal.com'
    ];

    for (const domain of blockedDomains) {
      const existingDomain = await BlockedDomain.findOne({ domain });
      if (!existingDomain) {
        await BlockedDomain.create({
          domain,
          reason: 'Temporary email service',
          addedBy: adminUserId,
          isActive: true
        });
        console.log(`✅ Blocked domain: ${domain}`);
      }
    }

    console.log('✅ Default blocked domains created/verified');
  } catch (error) {
    console.error('❌ Error creating blocked domains:', error);
    throw error;
  }
};

/**
 * Main Seed Function
 */
const seedAdminData = async () => {
  try {
    console.log('🌱 Starting admin data seeding...\n');

    // Connect to database
    await connectDB();

    // Create admin user
    const adminUser = await createAdminUser();

    // Create default settings
    await createDefaultSettings();

    // Create blocked domains
    await createDefaultBlockedDomains(adminUser._id);

    console.log('\n🎉 Admin data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Admin user: ✅');
    console.log('• System settings: ✅');
    console.log('• Blocked domains: ✅');
    console.log('\n🚀 You can now access the admin dashboard with:');
    console.log('📧 Email: admin@comsats.edu.pk');
    console.log('🔑 Password: Admin@123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Check if script is run directly
if (require.main === module) {
  seedAdminData();
}

module.exports = { seedAdminData, createAdminUser };