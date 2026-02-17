const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Student = require('../models/Student');
const SupervisionRequest = require('../models/SupervisionRequest');
require('dotenv').config();

// Sample Pakistani names
const firstNames = [
  'Abdullah', 'Ahmed', 'Ali', 'Usman', 'Hassan', 'Hamza', 'Bilal', 'Faisal',
  'Zain', 'Arslan', 'Saad', 'Omar', 'Talha', 'Waqas', 'Imran', 'Junaid',
  'Kamran', 'Nadir', 'Shahzad', 'Tariq', 'Yasir', 'Zahid', 'Adnan', 'Asad',
  'Fahad', 'Haris', 'Khalid', 'Muneeb', 'Nabeel', 'Raza', 'Saqib', 'Umair',
  'Ayesha', 'Fatima', 'Maryam', 'Zainab', 'Aisha', 'Hira', 'Khadija', 'Sana',
  'Aliza', 'Bushra', 'Dua', 'Fariha', 'Hina', 'Mahnoor', 'Nida', 'Rabia',
  'Sadia', 'Urooj', 'Warda', 'Zara'
];

const lastNames = [
  'Khan', 'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Malik', 'Sheikh', 'Syed',
  'Abbas', 'Akram', 'Aslam', 'Bashir', 'Butt', 'Chaudhry', 'Haider', 'Iqbal',
  'Javed', 'Karim', 'Mahmood', 'Mirza', 'Nadeem', 'Rauf', 'Rizvi', 'Saeed',
  'Saleem', 'Tariq', 'Umar', 'Yousaf', 'Zaman', 'Aziz'
];

const departments = [
  'Computer Science',
  'Software Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Information Technology',
  'Telecommunications'
];

const semesters = ['5th Semester', '6th Semester', '7th Semester', '8th Semester'];

const statuses = ['pending', 'accepted', 'rejected'];

const supervisorComments = [
  'OK Betha',
  'Welcome to my supervision',
  'Please schedule a meeting for orientation',
  'Looking forward to working with you',
  'Approved. Check your email for further details',
  'Good academic record. Accepted',
  'Please maintain regular communication',
  'Excellent CGPA. Happy to supervise',
  'Make sure to attend weekly meetings',
  'Approved. Submit weekly progress reports'
];

const rejectionComments = [
  'Currently at full capacity',
  'Your department does not match my expertise',
  'Please improve your CGPA and reapply',
  'I am on sabbatical this semester',
  'Already supervising maximum students'
];

// Generate random date within last 30 days
function getRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

// Generate random time
function getRandomTime() {
  const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
  const minute = Math.floor(Math.random() * 60);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// Generate random CGPA between 2.5 and 4.0
function getRandomCGPA() {
  return (Math.random() * 1.5 + 2.5).toFixed(2);
}

// Generate roll number
function generateRollNumber(index) {
  const year = Math.floor(Math.random() * 5) + 20; // SP20 to SP24
  const dept = ['BCS', 'BSE', 'BEE', 'BME', 'BCE', 'BBA', 'BIT'][Math.floor(Math.random() * 7)];
  const num = (index + 1).toString().padStart(3, '0');
  return `SP${year}-${dept}-${num}`;
}

async function seedSupervisionRequests() {
  try {
    console.log('🌱 Starting supervision requests seeding...\n');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB Connected for seeding\n');

    // Find the supervisor
    const supervisor = await User.findOne({ email: 'abdullahjaveda47@gmail.com' });
    
    if (!supervisor) {
      console.log('❌ Supervisor with email abdullahjaveda47@gmail.com not found!');
      console.log('📝 Creating supervisor account...\n');
      
      // Create supervisor if doesn't exist
      const newSupervisor = await User.create({
        name: 'Dr. Abdullah Javed',
        email: 'abdullahjaveda47@gmail.com',
        password: 'Supervisor@123',
        role: 'supervisor',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isApproved: true,
        maxStudents: 10
      });
      
      console.log('✅ Supervisor account created');
      console.log('📧 Email:', newSupervisor.email);
      console.log('🔑 Password: Supervisor@123\n');
      
      supervisorId = newSupervisor._id;
    } else {
      supervisorId = supervisor._id;
      console.log('✅ Found supervisor:', supervisor.name);
      console.log('📧 Email:', supervisor.email, '\n');
    }

    // Delete existing supervision requests for this supervisor
    const deleted = await SupervisionRequest.deleteMany({ supervisor: supervisorId });
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing requests\n`);

    // Create 50 students and supervision requests
    const requests = [];
    
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}@gmail.com`;
      const rollNumber = generateRollNumber(i);
      const department = departments[Math.floor(Math.random() * departments.length)];
      const semester = semesters[Math.floor(Math.random() * semesters.length)];
      const cgpa = getRandomCGPA();
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Create or find student user
      let studentUser = await User.findOne({ email });
      
      if (!studentUser) {
        studentUser = await User.create({
          name: fullName,
          email: email,
          password: 'Student@123',
          role: 'student',
          rollNumber: rollNumber,
          department: department,
          isApproved: true
        });
      }

      // Create or find student profile
      let studentProfile = await Student.findOne({ userId: studentUser._id });
      
      if (!studentProfile) {
        studentProfile = await Student.create({
          userId: studentUser._id,
          rollNumber: rollNumber,
          department: department,
          semester: semester,
          cgpa: parseFloat(cgpa),
          contact: `+92-300-${Math.floor(Math.random() * 9000000) + 1000000}`,
          address: `House ${Math.floor(Math.random() * 500) + 1}, Street ${Math.floor(Math.random() * 50) + 1}, Islamabad`
        });
      }

      // Create supervision request
      const submittedDate = getRandomDate(30);
      const submittedTime = getRandomTime();
      
      const requestData = {
        studentId: studentUser._id,
        studentName: fullName,
        studentEmail: email,
        studentRollNumber: rollNumber,
        studentDepartment: department,
        studentSemester: semester,
        studentCGPA: cgpa,
        studentPhoneNumber: `+92-300-${Math.floor(Math.random() * 9000000) + 1000000}`,
        supervisorId: supervisorId,
        supervisorName: supervisor.name,
        status: status,
        requestedAt: submittedDate
      };

      // Add comments and responded date based on status
      if (status === 'accepted') {
        const acceptedDate = new Date(submittedDate);
        acceptedDate.setHours(acceptedDate.getHours() + Math.floor(Math.random() * 48)); // Accepted within 48 hours
        
        requestData.supervisorComments = supervisorComments[Math.floor(Math.random() * supervisorComments.length)];
        requestData.respondedAt = acceptedDate;
      } else if (status === 'rejected') {
        const rejectedDate = new Date(submittedDate);
        rejectedDate.setHours(rejectedDate.getHours() + Math.floor(Math.random() * 72));
        
        requestData.supervisorComments = rejectionComments[Math.floor(Math.random() * rejectionComments.length)];
        requestData.respondedAt = rejectedDate;
      }

      const request = await SupervisionRequest.create(requestData);
      requests.push(request);
      
      console.log(`✅ Created request ${i + 1}/50: ${fullName} (${rollNumber}) - Status: ${status}`);
    }

    console.log('\n🎉 Supervision requests seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`• Total Requests: ${requests.length}`);
    console.log(`• Pending: ${requests.filter(r => r.status === 'pending').length}`);
    console.log(`• Approved: ${requests.filter(r => r.status === 'approved').length}`);
    console.log(`• Rejected: ${requests.filter(r => r.status === 'rejected').length}`);
    
    console.log('\n🚀 You can now view these requests in the Supervisor Dashboard!');
    console.log('📧 Supervisor Email: abdullahjaveda47@gmail.com');
    console.log('🔑 Supervisor Password: Supervisor@123\n');

  } catch (error) {
    console.error('❌ Error seeding supervision requests:', error);
  } finally {
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedSupervisionRequests();
