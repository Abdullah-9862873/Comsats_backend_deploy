const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Student = require('../models/Student');
require('dotenv').config();

// Pakistani names for students
const pakistaniNames = [
  'Ahmed Khan', 'Muhammad Ali', 'Fatima Zahra', 'Ayesha Malik', 'Hassan Raza',
  'Zainab Hussain', 'Bilal Ahmed', 'Sana Iqbal', 'Omar Farooq', 'Maryam Bibi',
  'Usman Tariq', 'Amina Yousaf', 'Hamza Sheikh', 'Hira Nawaz', 'Asad Mehmood',
  'Rabia Aslam', 'Saad Jameel', 'Nadia Pervaiz', 'Talha Mustafa', 'Khadija Rani',
  'Faisal Saeed', 'Bushra Akram', 'Adnan Riaz', 'Sadia Tahir', 'Imran Abbas',
  'Zara Sheikh', 'Kashif Butt', 'Mehwish Hayat', 'Arslan Ashraf', 'Alina Malik',
  'Shoaib Akhtar', 'Mahnoor Khan', 'Waqas Cheema', 'Sundas Ahmed', 'Junaid Jamshed',
  'Areeba Fatima', 'Nabeel Qureshi', 'Laiba Zafar', 'Aamir Liaquat', 'Nimra Shah',
  'Danish Kaneria', 'Komal Meer', 'Rizwan Ahmad', 'Iqra Aziz', 'Taimoor Sultan',
  'Sidra Batool', 'Qasim Ali', 'Minahil Rauf', 'Shahzad Anwar', 'Huma Nawaz',
  'Yasir Hussain', 'Aiman Khan', 'Nauman Ijaz', 'Sajal Aly', 'Feroze Khan',
  'Yumna Zaidi', 'Wahaj Ali', 'Mahira Khan', 'Fawad Khan', 'Aamna Ilyas'
];

// Departments
const departments = [
  'Computer Science', 'Software Engineering', 'Information Technology', 
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Business Administration', 'Management Sciences'
];

// Semesters
const semesters = ['5th', '6th', '7th', '8th'];

// Cover letter templates
const coverLetterTemplates = [
  "I am writing to express my keen interest in the {position} position at {company}. As a {semester} semester student pursuing {department} at COMSATS University, I have developed strong skills in {skills}. My academic background and hands-on project experience make me an ideal candidate for this internship opportunity. I am eager to contribute to your team and learn from industry professionals.",
  
  "With great enthusiasm, I am applying for the {position} role at {company}. Currently in my {semester} semester of {department}, I have gained practical experience through various academic projects and personal initiatives. I am particularly drawn to {company}'s innovative approach and would welcome the opportunity to contribute to your team while gaining invaluable industry experience.",
  
  "I am excited to apply for the {position} internship at {company}. As a dedicated {department} student in my {semester} semester at COMSATS, I have consistently demonstrated excellence in {skills}. I believe my strong analytical abilities, coupled with my passion for technology, make me a perfect fit for your organization.",
  
  "Please consider my application for the {position} position at {company}. My educational journey in {department} at COMSATS University has equipped me with both theoretical knowledge and practical skills. Currently in my {semester} semester, I am eager to apply my learning in a real-world environment and contribute meaningfully to your team.",
  
  "I am thrilled to submit my application for the {position} role at {company}. As an aspiring professional in {department}, currently in my {semester} semester, I have developed proficiency in {skills}. I am confident that my dedication, combined with the learning opportunity at {company}, will result in a mutually beneficial internship experience."
];

// Skills based on department
const skillsByDepartment = {
  'Computer Science': ['Python, Java, and Data Structures', 'Machine Learning and AI', 'Database Management and SQL', 'Algorithm Design and Analysis'],
  'Software Engineering': ['Full Stack Development', 'Agile Methodologies and SDLC', 'React, Node.js, and MongoDB', 'Software Testing and QA'],
  'Information Technology': ['Network Administration', 'Cybersecurity Fundamentals', 'Cloud Computing and AWS', 'IT Infrastructure Management'],
  'Electrical Engineering': ['Circuit Design and Analysis', 'Embedded Systems Programming', 'Power Systems and Control', 'Signal Processing'],
  'Mechanical Engineering': ['AutoCAD and SolidWorks', 'Thermodynamics and Fluid Mechanics', 'Manufacturing Processes', 'Product Design and Development'],
  'Civil Engineering': ['Structural Analysis', 'Construction Management', 'AutoCAD and Revit', 'Surveying and Geotechnics'],
  'Business Administration': ['Financial Analysis and Accounting', 'Marketing Strategy', 'Project Management', 'Business Analytics'],
  'Management Sciences': ['Operations Management', 'Strategic Planning', 'HR Management', 'Supply Chain Management']
};

// CV filenames
const cvFilenames = [
  'Resume_Professional.pdf', 'CV_2024.pdf', 'Curriculum_Vitae.pdf', 'My_Resume.pdf',
  'Professional_CV.pdf', 'Career_Profile.pdf', 'Academic_CV.pdf', 'Resume_Latest.pdf'
];

// Certificate types
const certificateTypes = [
  { name: 'Web_Development_Certification.pdf', type: 'Web Development' },
  { name: 'Python_Programming_Certificate.pdf', type: 'Python Programming' },
  { name: 'Data_Science_Bootcamp.pdf', type: 'Data Science' },
  { name: 'AWS_Cloud_Practitioner.pdf', type: 'AWS Cloud' },
  { name: 'Google_Analytics_Certificate.pdf', type: 'Google Analytics' },
  { name: 'Project_Management_PMP.pdf', type: 'Project Management' },
  { name: 'Digital_Marketing_Certificate.pdf', type: 'Digital Marketing' },
  { name: 'Machine_Learning_Specialization.pdf', type: 'Machine Learning' },
  { name: 'React_Developer_Certificate.pdf', type: 'React Development' },
  { name: 'Cybersecurity_Fundamentals.pdf', type: 'Cybersecurity' }
];

// Generate random roll number
const generateRollNumber = (index) => {
  const prefixes = ['SP21', 'SP22', 'SP23', 'FA21', 'FA22', 'FA23'];
  const programs = ['BCS', 'BSE', 'BIT', 'BEE', 'BME', 'BCE', 'BBA', 'BMS'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const program = programs[Math.floor(Math.random() * programs.length)];
  const num = String(index + 1).padStart(3, '0');
  return `${prefix}-${program}-${num}`;
};

// Generate random phone number
const generatePhoneNumber = () => {
  const prefixes = ['0300', '0301', '0302', '0303', '0304', '0311', '0312', '0313', '0321', '0322', '0331', '0332', '0341', '0342'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
};

// Generate random CGPA
const generateCGPA = () => {
  return (2.5 + Math.random() * 1.5).toFixed(2);
};

// Generate random attendance
const generateAttendance = () => {
  return Math.floor(75 + Math.random() * 25);
};

// Generate random date within range
const generateDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

// Application statuses distribution
const applicationStatuses = [
  { supervisorStatus: 'pending', companyStatus: 'pending', overallStatus: 'pending_supervisor', applicationStatus: 'pending' },
  { supervisorStatus: 'pending', companyStatus: 'pending', overallStatus: 'pending_supervisor', applicationStatus: 'pending' },
  { supervisorStatus: 'approved', companyStatus: 'pending', overallStatus: 'pending_company', applicationStatus: 'pending' },
  { supervisorStatus: 'approved', companyStatus: 'pending', overallStatus: 'pending_company', applicationStatus: 'pending' },
  { supervisorStatus: 'approved', companyStatus: 'approved', overallStatus: 'approved', applicationStatus: 'interview_scheduled' },
  { supervisorStatus: 'approved', companyStatus: 'approved', overallStatus: 'approved', applicationStatus: 'interview_done' },
  { supervisorStatus: 'approved', companyStatus: 'approved', overallStatus: 'approved', applicationStatus: 'hired' },
  { supervisorStatus: 'rejected', companyStatus: 'pending', overallStatus: 'rejected', applicationStatus: 'rejected' },
  { supervisorStatus: 'approved', companyStatus: 'rejected', overallStatus: 'rejected_final', applicationStatus: 'rejected' },
  { supervisorStatus: 'pending', companyStatus: 'pending', overallStatus: 'supervisor_changes_requested', applicationStatus: 'pending' },
  { supervisorStatus: 'pending', companyStatus: 'pending', overallStatus: 'resubmitted_to_supervisor', applicationStatus: 'pending' }
];

// Rejection reasons
const rejectionReasons = [
  "CGPA does not meet the minimum requirement for this position.",
  "The cover letter needs more specific details about relevant experience.",
  "Missing required certifications for this role.",
  "The CV needs to be updated with recent projects.",
  "Semester requirements not met for this internship.",
  "Attendance record is below the required threshold.",
  "Need more details about technical skills and proficiency levels.",
  "Application is incomplete - please provide all required documents."
];

// Supervisor comments
const supervisorComments = [
  "Excellent candidate with strong academic background.",
  "Good potential, recommended for interview.",
  "Well-prepared application, impressive portfolio.",
  "Strong technical skills demonstrated in projects.",
  "Recommend for consideration based on academic performance.",
  "Enthusiastic candidate with relevant experience.",
  "Good communication skills evident in cover letter.",
  "Strong recommendation based on classroom performance."
];

// Company comments
const companyComments = [
  "Impressive technical skills, looking forward to the interview.",
  "Great fit for our team culture and requirements.",
  "Strong problem-solving abilities demonstrated.",
  "Excellent communication during initial screening.",
  "Promising candidate for our development team.",
  "Good cultural fit with strong technical foundation."
];

async function seedJobApplications() {
  try {
    console.log('🌱 Starting Job Applications seeding process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected for seeding');

    // Get all active jobs
    const jobs = await Job.find({ status: 'Active' }).populate('companyId');
    if (jobs.length === 0) {
      console.log('❌ No active jobs found. Please run seedJobs.js first.');
      return;
    }
    console.log(`📋 Found ${jobs.length} active jobs`);

    // Get all supervisors
    const supervisors = await User.find({ role: 'supervisor', isVerified: true });
    if (supervisors.length === 0) {
      console.log('❌ No supervisors found. Please run seedCompanies.js first.');
      return;
    }
    console.log(`👨‍🏫 Found ${supervisors.length} supervisors`);

    // Get existing students or create new ones
    let students = await Student.find({ isActive: true }).limit(60);
    console.log(`👨‍🎓 Found ${students.length} existing students`);

    // Create student users if not enough exist
    const studentsToCreate = 60 - students.length;
    if (studentsToCreate > 0) {
      console.log(`📝 Creating ${studentsToCreate} new student records...`);
      
      for (let i = 0; i < studentsToCreate; i++) {
        const nameIndex = students.length + i;
        const name = pakistaniNames[nameIndex % pakistaniNames.length];
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}${nameIndex}@comsats.edu.pk`;
        const department = departments[Math.floor(Math.random() * departments.length)];
        const semester = semesters[Math.floor(Math.random() * semesters.length)];
        const rollNumber = generateRollNumber(nameIndex);
        
        // Check if student already exists
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
          students.push(existingStudent);
          continue;
        }

        // Create student record
        const student = new Student({
          fullName: name,
          email: email,
          department: department,
          semester: semester,
          password: '$2a$10$XQJz7K8EqK4L5GnzYj6xUOqyJ8MQ7KXGY8K2Ld1Xx7Oy4B5K9W6sK', // hashed password
          rollNumber: rollNumber,
          cgpa: parseFloat(generateCGPA()),
          phoneNumber: generatePhoneNumber(),
          attendance: generateAttendance(),
          backlogs: Math.floor(Math.random() * 2),
          isEligible: true,
          profileCompleted: true,
          cv: {
            filename: `cv_${nameIndex}.pdf`,
            originalName: cvFilenames[Math.floor(Math.random() * cvFilenames.length)],
            path: `/uploads/cv/cv_${nameIndex}.pdf`,
            size: Math.floor(100000 + Math.random() * 500000),
            uploadedAt: generateDate(30)
          },
          certificates: [
            {
              filename: `cert_${nameIndex}_1.pdf`,
              originalName: certificateTypes[Math.floor(Math.random() * certificateTypes.length)].name,
              path: `/uploads/certificates/cert_${nameIndex}_1.pdf`,
              size: Math.floor(50000 + Math.random() * 200000),
              uploadedAt: generateDate(60)
            }
          ]
        });

        await student.save();
        students.push(student);
        console.log(`   ✅ Created student: ${name}`);
      }
    }

    // Create corresponding User records for students who don't have them
    for (const student of students) {
      let userRecord = await User.findOne({ email: student.email, role: 'student' });
      if (!userRecord) {
        userRecord = new User({
          name: student.fullName,
          email: student.email,
          password: student.password,
          role: 'student',
          isVerified: true,
          rollNumber: student.rollNumber
        });
        await userRecord.save();
        console.log(`   ✅ Created user record for: ${student.fullName}`);
      }
    }

    // Clear existing applications for clean seeding (optional - comment out to keep existing)
    // await Application.deleteMany({});
    // console.log('🗑️  Cleared existing applications');

    // Create 55 job applications
    const totalApplications = 55;
    let createdCount = 0;

    console.log(`\n📝 Creating ${totalApplications} job applications...`);

    for (let i = 0; i < totalApplications; i++) {
      const student = students[i % students.length];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const statusConfig = applicationStatuses[Math.floor(Math.random() * applicationStatuses.length)];
      
      // Get user record for student
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) {
        console.log(`   ⚠️ User record not found for student: ${student.fullName}, skipping...`);
        continue;
      }

      // Check if application already exists
      const existingApp = await Application.findOne({
        studentId: studentUser._id,
        jobId: job._id
      });
      if (existingApp) {
        console.log(`   ⚠️ Application already exists for ${student.fullName} at ${job.jobTitle}, skipping...`);
        continue;
      }

      // Generate cover letter
      const skills = skillsByDepartment[student.department] || skillsByDepartment['Computer Science'];
      const coverLetter = coverLetterTemplates[Math.floor(Math.random() * coverLetterTemplates.length)]
        .replace('{position}', job.jobTitle)
        .replace('{company}', job.companyName)
        .replace('{semester}', student.semester)
        .replace('{department}', student.department)
        .replace('{skills}', skills[Math.floor(Math.random() * skills.length)]);

      // Create application
      const applicationData = {
        studentId: studentUser._id,
        studentName: student.fullName,
        studentEmail: student.email,
        studentProfile: {
          rollNumber: student.rollNumber,
          department: student.department,
          semester: student.semester,
          cgpa: student.cgpa,
          phoneNumber: student.phoneNumber,
          attendance: student.attendance,
          backlogs: student.backlogs,
          cv: student.cv,
          certificates: student.certificates
        },
        jobId: job._id,
        jobTitle: job.jobTitle,
        companyId: job.companyId._id || job.companyId,
        companyName: job.companyName,
        supervisorId: supervisor._id,
        supervisorName: supervisor.name,
        coverLetter: coverLetter,
        supervisorStatus: statusConfig.supervisorStatus,
        companyStatus: statusConfig.companyStatus,
        overallStatus: statusConfig.overallStatus,
        applicationStatus: statusConfig.applicationStatus,
        appliedAt: generateDate(30),
        supervisorReviewedAt: statusConfig.supervisorStatus !== 'pending' ? generateDate(25) : null,
        companyReviewedAt: statusConfig.companyStatus !== 'pending' ? generateDate(20) : null
      };

      // Add status-specific data
      if (statusConfig.supervisorStatus === 'approved') {
        applicationData.supervisorComments = supervisorComments[Math.floor(Math.random() * supervisorComments.length)];
      }

      if (statusConfig.supervisorStatus === 'rejected' || statusConfig.overallStatus === 'supervisor_changes_requested') {
        applicationData.rejectionNote = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
        applicationData.rejectionFeedback = {
          reason: 'Application needs improvements',
          details: rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)],
          requestedFixes: ['Update CV', 'Improve cover letter'],
          fieldsToEdit: ['coverLetter', 'cvUrl'],
          bySupervisorId: supervisor._id,
          at: generateDate(25)
        };
      }

      if (statusConfig.companyStatus === 'approved') {
        applicationData.companyComments = companyComments[Math.floor(Math.random() * companyComments.length)];
      }

      if (statusConfig.companyStatus === 'rejected') {
        applicationData.companyRejectionNote = "We have decided to proceed with other candidates whose qualifications more closely match our current needs.";
      }

      if (statusConfig.applicationStatus === 'interview_scheduled' || statusConfig.applicationStatus === 'interview_done') {
        const interviewDate = new Date();
        interviewDate.setDate(interviewDate.getDate() + Math.floor(Math.random() * 14));
        applicationData.interviewDetails = {
          type: Math.random() > 0.5 ? 'remote' : 'in-person',
          date: interviewDate,
          time: ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'][Math.floor(Math.random() * 5)],
          location: 'Islamabad Office, F-7 Markaz',
          meetingLink: 'https://meet.google.com/' + Math.random().toString(36).substring(7),
          notes: 'Please bring your portfolio and be prepared for technical questions.'
        };
      }

      if (statusConfig.applicationStatus === 'hired') {
        applicationData.hiringDate = generateDate(10);
        applicationData.isCurrentlyHired = true;
        applicationData.startDate = new Date();
        applicationData.endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        applicationData.department = student.department;
        applicationData.jobPosition = job.jobTitle;
      }

      const application = new Application(applicationData);
      await application.save();
      createdCount++;
      
      // Update job applications count
      await Job.findByIdAndUpdate(job._id, { $inc: { applicationsCount: 1 } });

      const statusEmoji = {
        'pending_supervisor': '⏳',
        'supervisor_changes_requested': '🔄',
        'resubmitted_to_supervisor': '📤',
        'pending_company': '🏢',
        'approved': '✅',
        'rejected': '❌',
        'rejected_final': '🚫'
      };

      console.log(`   ${statusEmoji[statusConfig.overallStatus] || '📝'} Created application #${createdCount}: ${student.fullName} → ${job.jobTitle} at ${job.companyName} [${statusConfig.overallStatus}]`);
    }

    // Summary statistics
    console.log('\n📊 Seeding Summary:');
    console.log('═══════════════════════════════════════');
    
    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$overallStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`   Total Applications Created: ${createdCount}`);
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    const hiredCount = await Application.countDocuments({ applicationStatus: 'hired' });
    const interviewCount = await Application.countDocuments({ applicationStatus: { $in: ['interview_scheduled', 'interview_done'] } });
    
    console.log(`   Interviews Scheduled/Done: ${interviewCount}`);
    console.log(`   Currently Hired: ${hiredCount}`);
    console.log('═══════════════════════════════════════');
    
    console.log('\n🎉 Job Applications seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding job applications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedJobApplications();
