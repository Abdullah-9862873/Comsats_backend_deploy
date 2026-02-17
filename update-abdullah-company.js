require('dotenv').config();
const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User');

async function updateAbdullahCompany() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Find Abdullah 22 company
    const company = await CompanyProfile.findOne({ companyName: 'Abdullah 22' });
    
    if (company) {
      console.log('Updating Abdullah 22 company with proper Step 3 data...');
      
      // Update with proper registration data
      company.industry = 'Information Technology';
      company.website = 'https://www.abdullah-tech.com';
      company.about = 'Abdullah Tech Solutions is a leading software development company specializing in web applications, mobile development, and digital transformation. We provide innovative solutions for businesses looking to modernize their operations and enhance their digital presence.';
      
      await company.save();
      
      console.log('✅ Updated company successfully!');
      console.log('Company Name:', company.companyName);
      console.log('Industry:', company.industry);
      console.log('Website:', company.website);
      console.log('About:', company.about.substring(0, 100) + '...');
    } else {
      console.log('Abdullah 22 company not found');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAbdullahCompany();