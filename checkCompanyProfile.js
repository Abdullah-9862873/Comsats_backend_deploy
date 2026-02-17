const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User');

const checkCompanyProfile = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find company user
    const company = await User.findOne({ role: 'company' });
    console.log('Company user:', company ? company.name : 'Not found');
    console.log('Company ID:', company._id);

    // Find company profile
    const companyProfile = await CompanyProfile.findOne({ userId: company._id });
    console.log('Company profile:', companyProfile ? companyProfile.organizationName : 'Not found');

    if (!companyProfile) {
      console.log('❌ Company profile not found! Using user name as fallback:', company.name);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCompanyProfile();
