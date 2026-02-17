const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');

const checkCompanies = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const companies = await User.find({ role: 'company' });
    console.log('\n🏢 Companies found:');
    companies.forEach(c => {
      console.log(`- ${c.name} (Role: ${c.role}, Email: ${c.email})`);
    });

    console.log('\n🔍 Checking Tech Pro specifically:');
    const techPro = await User.findOne({ name: 'Tech Pro' });
    if (techPro) {
      console.log('Tech Pro details:');
      console.log('- ID:', techPro._id);
      console.log('- Name:', techPro.name);
      console.log('- Email:', techPro.email);
      console.log('- Role:', techPro.role);
      console.log('- Created:', techPro.createdAt);
    } else {
      console.log('Tech Pro not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkCompanies();
