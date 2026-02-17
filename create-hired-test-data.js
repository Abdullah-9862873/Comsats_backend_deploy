const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');
const Student = require('./models/Student');
const Application = require('./models/Application');

mongoose.connect('mongodb://localhost:27017/FYP_Project')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await CompanyProfile.deleteMany({});
    await Student.deleteMany({});
    await Application.deleteMany({});
    
    // Create test company
    console.log('Creating test company...');
    const companyUser = new User({
      name: 'TechCorp Solutions',
      email: 'testcompany@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'company',
      isVerified: true
    });
    await companyUser.save();
    
    const companyProfile = new CompanyProfile({
      user: companyUser._id,
      companyName: 'TechCorp Solutions',
      industry: 'Technology',
      description: 'Leading technology company',
      website: 'https://techcorp.com',
      phone: '+1234567890',
      address: '123 Tech Street',
      city: 'Tech City',
      country: 'Pakistan',
      companySize: '100-500',
      establishedYear: 2020,
      businessLicense: 'BL123456',
      taxId: 'TX789012'
    });
    await companyProfile.save();
    
    console.log(`Company created with ID: ${companyUser._id}`);
    
    // Create test students
    console.log('Creating test students...');
    const students = [];
    
    for (let i = 1; i <= 5; i++) {
      const student = new Student({
        fullName: `Test Student ${i}`,
        email: `student${i}@example.com`,
        department: 'Computer Science',
        semester: '8th',
        password: await bcrypt.hash('password123', 10),
        rollNumber: `2021-CS-${String(i).padStart(3, '0')}`,
        phoneNumber: `+123456789${i}`,
        cgpa: 3.0 + (i * 0.2),
        attendance: 85 + i,
        backlogs: 0,
        codeOfConduct: true,
        isEligible: true
      });
      await student.save();
      students.push(student);
    }
    
    console.log(`Created ${students.length} students`);
    
    // Create applications with different statuses
    console.log('Creating applications...');
    
    const applicationData = [
      {
        student: students[0]._id,
        status: 'pending',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        student: students[1]._id,
        status: 'interview_scheduled',
        appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        interviewDetails: {
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          time: '10:00 AM',
          type: 'remote',
          meetingLink: 'https://meet.google.com/abc-def-ghi'
        }
      },
      {
        student: students[2]._id,
        status: 'hired',
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        hiringDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hired 2 days ago
        offerStatus: 'accepted'
      },
      {
        student: students[3]._id,
        status: 'hired',
        appliedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        hiringDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hired 1 day ago
        offerStatus: 'accepted'
      },
      {
        student: students[4]._id,
        status: 'rejected',
        appliedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        rejectionReason: 'Position filled'
      }
    ];
    
    for (let appData of applicationData) {
      const application = new Application({
        student: appData.student,
        company: companyUser._id,
        jobPosition: 'Software Developer Intern',
        applicationStatus: appData.status,
        appliedAt: appData.appliedAt,
        interviewDetails: appData.interviewDetails,
        hiringDate: appData.hiringDate,
        offerStatus: appData.offerStatus,
        rejectionReason: appData.rejectionReason
      });
      await application.save();
      console.log(`Created application for student ${appData.student} with status: ${appData.status}`);
    }
    
    // Verify the data
    console.log('\n=== Verification ===');
    const allApplications = await Application.find({ company: companyUser._id })
      .populate('student', 'fullName rollNumber');
    
    console.log(`Total applications for company: ${allApplications.length}`);
    
    allApplications.forEach(app => {
      console.log(`- ${app.student.fullName} (${app.student.rollNumber}): ${app.applicationStatus}`);
    });
    
    const hiredCount = allApplications.filter(app => app.applicationStatus === 'hired').length;
    console.log(`\nHired students: ${hiredCount}`);
    
    console.log(`\n✅ Test data created successfully!`);
    console.log(`Company ID: ${companyUser._id}`);
    console.log(`Company Email: testcompany@example.com`);
    console.log(`Password: password123`);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });