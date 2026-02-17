require('dotenv').config();
const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User');

async function checkCompanyData() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== COMPANY PROFILES IN DATABASE ===');
    const companies = await CompanyProfile.find().populate('user', 'name email role');
    
    if (companies.length === 0) {
      console.log('No company profiles found');
    }
    
    companies.forEach((company, index) => {
      console.log(`\nCompany ${index + 1}:`);
      console.log('ID:', company._id);
      console.log('User:', company.user?.name, '(' + company.user?.email + ')');
      console.log('Company Name:', company.companyName);
      console.log('Industry:', company.industry);
      console.log('Website:', company.website);
      console.log('About:', company.about);
      console.log('Status:', company.status);
      console.log('Created At:', company.createdAt);
      console.log('---');
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCompanyData();