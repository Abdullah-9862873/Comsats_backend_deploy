const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

const sampleCompanies = [
  {
    companyName: "TechCorp Solutions",
    industry: "Technology",
    location: "Karachi, Pakistan",
    companySize: "51-200",
    description: "Leading software development company specializing in web and mobile applications. We provide innovative solutions for businesses across various industries.",
    website: "https://techcorp.example.com",
    establishedYear: 2015,
    contactPerson: {
      name: "Ahmed Khan",
      designation: "HR Manager",
      email: "ahmed.khan@techcorp.com",
      phone: "+92-300-1234567"
    },
    socialMedia: {
      linkedin: "https://linkedin.com/company/techcorp",
      twitter: "https://twitter.com/techcorp",
      facebook: "https://facebook.com/techcorp"
    }
  },
  {
    companyName: "Green Energy Solutions",
    industry: "Energy",
    location: "Lahore, Pakistan",
    companySize: "11-50",
    description: "Pioneering renewable energy solutions with focus on solar and wind power systems. Committed to sustainable development and environmental protection.",
    website: "https://greenenergy.example.com",
    establishedYear: 2018,
    contactPerson: {
      name: "Fatima Ali",
      designation: "Recruitment Lead",
      email: "fatima.ali@greenenergy.com",
      phone: "+92-301-2345678"
    },
    socialMedia: {
      linkedin: "https://linkedin.com/company/greenenergy",
      instagram: "https://instagram.com/greenenergy"
    }
  },
  {
    companyName: "Healthcare Innovations Ltd",
    industry: "Healthcare",
    location: "Islamabad, Pakistan",
    companySize: "201-500",
    description: "Advanced healthcare technology company developing medical devices and healthcare management systems. Improving patient care through innovation.",
    website: "https://healthcareinnovations.example.com",
    establishedYear: 2012,
    contactPerson: {
      name: "Dr. Sarah Ahmed",
      designation: "Director of Human Resources",
      email: "sarah.ahmed@healthcareinnovations.com",
      phone: "+92-302-3456789"
    },
    socialMedia: {
      linkedin: "https://linkedin.com/company/healthcareinnovations",
      youtube: "https://youtube.com/healthcareinnovations"
    }
  },
  {
    companyName: "FinTech Solutions",
    industry: "Finance",
    location: "Karachi, Pakistan",
    companySize: "51-200",
    description: "Digital banking and financial technology solutions. Revolutionizing the way people interact with financial services through mobile applications.",
    website: "https://fintech.example.com",
    establishedYear: 2020,
    contactPerson: {
      name: "Hassan Malik",
      designation: "Talent Acquisition Manager",
      email: "hassan.malik@fintech.com",
      phone: "+92-303-4567890"
    },
    socialMedia: {
      linkedin: "https://linkedin.com/company/fintech",
      twitter: "https://twitter.com/fintech",
      facebook: "https://facebook.com/fintech",
      instagram: "https://instagram.com/fintech"
    }
  },
  {
    companyName: "EduTech Learning",
    industry: "Education",
    location: "Remote",
    companySize: "11-50",
    description: "Online education platform providing interactive courses and learning management systems. Empowering students and professionals through technology.",
    website: "https://edutech.example.com",
    establishedYear: 2019,
    contactPerson: {
      name: "Aisha Rahman",
      designation: "People Operations Lead",
      email: "aisha.rahman@edutech.com",
      phone: "+92-304-5678901"
    },
    socialMedia: {
      linkedin: "https://linkedin.com/company/edutech",
      youtube: "https://youtube.com/edutech",
      facebook: "https://facebook.com/edutech"
    }
  }
];

async function createSampleCompanies() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal');
    console.log('Connected to MongoDB');

    // First, create company users for each company
    for (let i = 0; i < sampleCompanies.length; i++) {
      const companyData = sampleCompanies[i];
      
      // Check if company user already exists
      let companyUser = await User.findOne({ 
        email: companyData.contactPerson.email,
        role: 'company'
      });

      if (!companyUser) {
        companyUser = new User({
          name: companyData.companyName,
          email: companyData.contactPerson.email,
          password: 'hashedpassword123', // In real app, this would be properly hashed
          role: 'company',
          isVerified: true
        });
        await companyUser.save();
        console.log(`Created company user: ${companyUser.name}`);
      }

      // Check if company profile already exists
      const existingProfile = await CompanyProfile.findOne({ 
        user: companyUser._id 
      });

      if (!existingProfile) {
        const companyProfile = new CompanyProfile({
          user: companyUser._id,
          ...companyData
        });
        
        await companyProfile.save();
        console.log(`Created company profile: ${companyData.companyName}`);
      } else {
        console.log(`Company profile already exists: ${companyData.companyName}`);
      }
    }

    // Count total companies
    const totalCompanies = await CompanyProfile.countDocuments();
    console.log(`\nTotal company profiles in database: ${totalCompanies}`);

    // Display summary
    const companies = await CompanyProfile.find()
      .populate('user', 'name email')
      .select('companyName industry location companySize');
    
    console.log('\nCompany Profiles Summary:');
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.companyName} - ${company.industry} (${company.location})`);
    });

    console.log('\nSample companies created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample companies:', error);
    process.exit(1);
  }
}

createSampleCompanies();
