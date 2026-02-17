const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

async function checkCompanyDetails() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the real company with complete profile
    const company = await CompanyProfile.findOne({ profileCompleteness: 100 }).populate('user', 'name email');
    
    if (company) {
      console.log('\n🏢 COMPLETE COMPANY PROFILE DATA:');
      console.log('==========================================');
      console.log(`Company Name: ${company.companyName}`);
      console.log(`Industry: ${company.industry}`);
      console.log(`Location: ${company.location}`);
      console.log(`Company Size: ${company.companySize}`);
      console.log(`Website: ${company.website}`);
      console.log(`Profile Completeness: ${company.profileCompleteness}%`);
      console.log(`Email: ${company.user?.email}`);
      
      console.log('\n📝 DESCRIPTION:');
      console.log(company.description || 'No description provided');
      
      console.log('\n🎯 MISSION:');
      console.log(company.mission || 'No mission provided');
      
      console.log('\n👁️ VISION:');
      console.log(company.vision || 'No vision provided');
      
      console.log('\n💼 VALUES:');
      console.log(company.values || 'No values provided');
      
      console.log('\n📞 CONTACT PERSON:');
      if (company.contactPerson) {
        console.log(`Name: ${company.contactPerson.name || 'N/A'}`);
        console.log(`Designation: ${company.contactPerson.designation || 'N/A'}`);
        console.log(`Email: ${company.contactPerson.email || 'N/A'}`);
        console.log(`Phone: ${company.contactPerson.phone || 'N/A'}`);
      }
      
      console.log('\n🌐 SOCIAL MEDIA:');
      if (company.socialMedia) {
        console.log(`LinkedIn: ${company.socialMedia.linkedin || 'N/A'}`);
        console.log(`Twitter: ${company.socialMedia.twitter || 'N/A'}`);
        console.log(`Facebook: ${company.socialMedia.facebook || 'N/A'}`);
        console.log(`Website: ${company.socialMedia.website || 'N/A'}`);
      }
      
      console.log('\n🖼️ IMAGES:');
      console.log(`Logo: ${company.logoImage ? `${company.logoImage.path}` : 'No logo'}`);
      console.log(`Banner: ${company.bannerImage ? `${company.bannerImage.path}` : 'No banner'}`);
      
      console.log('\n📋 DOCUMENTS:');
      if (company.documents && company.documents.length > 0) {
        company.documents.forEach((doc, index) => {
          console.log(`${index + 1}. ${doc.name} (${doc.filename})`);
        });
      } else {
        console.log('No documents uploaded');
      }
      
      console.log('\n🏆 CERTIFICATIONS:');
      if (company.certifications && company.certifications.length > 0) {
        company.certifications.forEach((cert, index) => {
          console.log(`${index + 1}. ${cert.title} by ${cert.issuedBy}`);
        });
      } else {
        console.log('No certifications provided');
      }
      
      console.log('\n📊 PROFILE SECTIONS:');
      console.log(`Founded Year: ${company.foundedYear || 'N/A'}`);
      console.log(`Employee Count: ${company.employeeCount || 'N/A'}`);
      console.log(`Revenue: ${company.revenue || 'N/A'}`);
      console.log(`Company Type: ${company.companyType || 'N/A'}`);
      
    } else {
      console.log('❌ No company found with 100% profile completion');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCompanyDetails();
