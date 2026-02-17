const mongoose = require('mongoose');
const InternshipReport = require('./models/InternshipReport');
const User = require('./models/User');
const Application = require('./models/Application');
const CompanyProfile = require('./models/CompanyProfile');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://alitalha30042001:talha12345@cluster0.n5hjckh.mongodb.net/fyp_internship_system');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testInternshipReports = async () => {
  try {
    await connectDB();

    console.log('\n🧪 Testing Internship Report System...\n');

    // 1. Check if we have test data
    const student = await User.findOne({ role: 'student', name: 'Student_6' });
    const supervisor = await User.findOne({ role: 'supervisor', name: 'Supervisor_1' });
    
    if (!student || !supervisor) {
      console.log('❌ Missing test users. Need Student_6 and Supervisor_1');
      return;
    }

    console.log('✅ Found test users:', {
      student: student.name,
      supervisor: supervisor.name
    });

    // 2. Check for approved application
    const application = await Application.findOne({
      studentId: student._id,
      supervisorStatus: 'approved'
    }).populate('companyId');

    if (!application) {
      console.log('❌ No approved application found for test student');
      return;
    }

    console.log('✅ Found approved application:', {
      company: application.companyId?.companyName || 'N/A',
      supervisor: application.supervisorId
    });

    // 3. Check for existing internship report
    const existingReport = await InternshipReport.findOne({ studentId: student._id });
    
    if (existingReport) {
      console.log('📋 Existing internship report found:', {
        id: existingReport._id,
        title: existingReport.projectTitle,
        status: existingReport.status,
        submittedAt: existingReport.submittedAt
      });
    } else {
      console.log('📋 No existing internship report found');
    }

    // 4. Test report creation (simulate)
    console.log('\n🔧 Testing report structure...');
    
    const testReport = new InternshipReport({
      studentId: student._id,
      supervisorId: supervisor._id,
      companyId: application.companyId?._id || new mongoose.Types.ObjectId(),
      projectTitle: 'AI-powered Fruit Detection System',
      projectDescription: 'Developed a comprehensive fruit detection system using YOLOv8 deep learning model. The system can identify and classify various fruits in real-time using computer vision techniques. Implemented a web interface using Flask for easy interaction and deployed the model for practical use.',
      documentationFile: {
        filename: 'test_internship_report.pdf',
        originalname: 'Internship Final Report.pdf',
        url: '/uploads/internship-reports/test/test_internship_report.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        uploadedAt: new Date()
      },
      status: 'Submitted'
    });

    // Validate without saving
    const validationError = testReport.validateSync();
    if (validationError) {
      console.log('❌ Validation errors:', validationError.errors);
    } else {
      console.log('✅ Report structure is valid');
    }

    // 5. Test static methods
    console.log('\n🔍 Testing static methods...');
    
    if (existingReport) {
      const reportByStudent = await InternshipReport.findByStudent(student._id);
      console.log('✅ findByStudent works:', !!reportByStudent);
      
      const reportsBySupervisor = await InternshipReport.findBySupervisor(supervisor._id);
      console.log('✅ findBySupervisor works:', reportsBySupervisor.length, 'reports found');
    }

    // 6. Test instance methods
    if (existingReport) {
      console.log('\n🔧 Testing instance methods...');
      console.log('✅ isReviewed():', existingReport.isReviewed());
      console.log('✅ hasFeedback():', existingReport.hasFeedback());
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run tests
testInternshipReports();
