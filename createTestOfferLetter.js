const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./models/User');
const Student = require('./models/Student');
const Job = require('./models/Job');
const OfferLetter = require('./models/OfferLetter');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestOfferLetter = async () => {
  try {
    await connectDB();

    // Find the company user (Tech Pro)
    const company = await User.findOne({ email: 'company123@gmail.com', role: 'company' });
    if (!company) {
      console.log('❌ Company not found');
      return;
    }
    console.log('✅ Found company:', company.name);

    // Find or create a test student
    let student = await User.findOne({ role: 'student' });
    if (!student) {
      // Create a test student
      student = new User({
        name: 'Test Student',
        email: 'teststudent@example.com',
        password: 'password123',
        role: 'student'
      });
      await student.save();
      console.log('✅ Created test student');
    } else {
      console.log('✅ Found student:', student.name);
    }

    // Find or create a test supervisor
    let supervisor = await User.findOne({ role: 'supervisor' });
    if (!supervisor) {
      supervisor = new User({
        name: 'Test Supervisor',
        email: 'testsupervisor@example.com',
        password: 'password123',
        role: 'supervisor'
      });
      await supervisor.save();
      console.log('✅ Created test supervisor');
    } else {
      console.log('✅ Found supervisor:', supervisor.name);
    }

    // Find or create a test job
    let job = await Job.findOne({ companyId: company._id });
    if (!job) {
      job = new Job({
        title: 'Test Internship Position',
        description: 'Test internship for misconduct reporting',
        companyId: company._id,
        companyName: company.name,
        location: 'Test Location',
        type: 'internship',
        requirements: ['Test requirement'],
        skills: ['Test skill'],
        duration: '3 months',
        stipend: 15000,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await job.save();
      console.log('✅ Created test job');
    } else {
      console.log('✅ Found job:', job.title);
    }

    // Check if offer letter already exists
    const existingOffer = await OfferLetter.findOne({
      studentId: student._id,
      companyId: company._id
    });

    if (existingOffer) {
      console.log('✅ Offer letter already exists');
      return;
    }

    // Create test offer letter
    const offerLetter = new OfferLetter({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      companyId: company._id,
      organizationName: company.name,
      organizationAddress: '123 Test Street, Test City',
      representativeName: 'Test Representative',
      representativePosition: 'HR Manager',
      jobId: job._id,
      jobTitle: job.title || 'Test Internship Position',
      supervisorId: supervisor._id,
      supervisorName: supervisor.name,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000),
      customMessage: 'Welcome to our internship program!',
      offerLetterContent: 'Test offer letter content',
      status: 'sent',
      studentResponse: {
        response: 'accepted',
        respondedAt: new Date()
      }
    });

    await offerLetter.save();
    console.log('✅ Test offer letter created successfully');
    console.log('📧 Student:', student.name, '(' + student.email + ')');
    console.log('🏢 Company:', company.name);
    console.log('👨‍🏫 Supervisor:', supervisor.name);

  } catch (error) {
    console.error('❌ Error creating test offer letter:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestOfferLetter();