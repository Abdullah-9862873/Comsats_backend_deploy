const mongoose = require('mongoose');
require('dotenv').config();

async function checkCompanyData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Application = require('./models/Application');
    const User = require('./models/User');
    
    // Find hired application with populated company
    const app = await Application.findOne({ 
      studentId: '68c1689a6909d193253ba601',
      applicationStatus: 'hired'
    }).populate('companyId');
    
    if (app && app.companyId) {
      console.log('✅ Company data:', {
        companyId: app.companyId._id,
        companyName: app.companyId.name,
        companyEmail: app.companyId.email,
        companyType: app.companyId.role
      });
    } else {
      console.log('❌ No company data found');
      
      // Check the company directly
      const companyId = '68c1481266c1eea118dd4044';
      const company = await User.findById(companyId);
      if (company) {
        console.log('📋 Direct company lookup:', {
          id: company._id,
          name: company.name,
          email: company.email,
          role: company.role
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCompanyData();
