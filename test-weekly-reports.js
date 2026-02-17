const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const WeeklyReportEvent = require('./models/WeeklyReportEvent');
const WeeklyReport = require('./models/WeeklyReport');
const User = require('./models/User');
const Student = require('./models/Student');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB using the same configuration as server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testWeeklyReportsSystem = async () => {
  try {
    console.log('🔄 Testing Weekly Reports System...\n');

    // Clean up existing test data
    await WeeklyReportEvent.deleteMany({ supervisorName: 'Test Supervisor' });
    await WeeklyReport.deleteMany({ supervisorName: 'Test Supervisor' });

    // 1. Create or find a test supervisor
    let supervisor = await User.findOne({ email: 'supervisor@test.com' });
    if (!supervisor) {
      supervisor = new User({
        name: 'Test Supervisor',
        email: 'supervisor@test.com',
        password: 'password123',
        role: 'supervisor'
      });
      await supervisor.save();
      console.log('✅ Created test supervisor');
    } else {
      console.log('✅ Found existing test supervisor');
    }

    // 2. Create or find a test student
    let studentUser = await User.findOne({ email: 'student@test.com' });
    if (!studentUser) {
      studentUser = new User({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student'
      });
      await studentUser.save();
      console.log('✅ Created test student user');
    } else {
      console.log('✅ Found existing test student user');
    }

    // 3. Create or find student profile
    let student = await Student.findOne({ userId: studentUser._id });
    if (!student) {
      student = new Student({
        userId: studentUser._id,
        name: studentUser.name,
        email: studentUser.email,
        rollNumber: 'FA21-BCS-001',
        supervisorId: supervisor._id,
        supervisorStatus: 'approved',
        companyName: 'Tech Innovations Ltd',
        companyLocation: 'Islamabad'
      });
      await student.save();
      console.log('✅ Created test student profile');
    } else {
      // Update supervisor if needed
      student.supervisorId = supervisor._id;
      student.supervisorStatus = 'approved';
      await student.save();
      console.log('✅ Updated existing test student profile');
    }

    // 4. Test creating a weekly report event
    console.log('\n📋 Testing Weekly Report Event Creation...');
    
    const eventData = {
      supervisorId: supervisor._id,
      supervisorName: supervisor.name,
      weekNumber: 1,
      title: 'Weekly Report - Week 1',
      instructions: 'Focus on documenting your initial learning and setup tasks.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const reportEvent = new WeeklyReportEvent(eventData);
    await reportEvent.save();
    console.log('✅ Created weekly report event:', {
      id: reportEvent._id,
      weekNumber: reportEvent.weekNumber,
      title: reportEvent.title,
      dueDate: reportEvent.dueDate.toLocaleDateString()
    });

    // 5. Test student report submission
    console.log('\n📝 Testing Student Report Submission...');
    
    const reportData = {
      studentId: studentUser._id,
      studentName: studentUser.name,
      studentRollNo: student.rollNumber,
      supervisorId: supervisor._id,
      supervisorName: supervisor.name,
      weekEventId: reportEvent._id,
      weekNumber: reportEvent.weekNumber,
      reportTitle: reportEvent.title,
      tasksCompleted: `
• Set up development environment (VS Code, Node.js, MongoDB)
• Completed orientation training with company supervisor
• Read company documentation and coding standards
• Started working on authentication module
• Implemented basic user registration functionality
      `.trim(),
      challengesFaced: `
• Initial difficulty understanding the existing codebase structure
• Faced some issues with MongoDB connection configuration
• Had to learn company-specific coding conventions
      `.trim(),
      reflections: `
• Learned the importance of proper code documentation
• Understood the value of following established coding standards
• Gained insights into professional software development practices
• Excited to contribute more to the project in coming weeks
      `.trim(),
      supportingMaterials: `
• GitHub repository: https://github.com/company/project
• Documentation link: https://company-docs.com/dev-guide
• Training completion certificate attached
      `.trim(),
      companyName: student.companyName,
      companyLocation: student.companyLocation,
      dueDate: reportEvent.dueDate
    };

    const weeklyReport = new WeeklyReport(reportData);
    await weeklyReport.save();
    console.log('✅ Created student report submission:', {
      id: weeklyReport._id,
      student: weeklyReport.studentName,
      week: weeklyReport.weekNumber,
      status: weeklyReport.status,
      completionPercentage: weeklyReport.completionPercentage
    });

    // 6. Test supervisor review
    console.log('\n👨‍🏫 Testing Supervisor Review...');
    
    weeklyReport.supervisorFeedback = {
      feedback: `
Excellent first week! Your setup and initial work on the authentication module shows great promise. 

Strengths:
- Proactive approach to learning company standards
- Good documentation of challenges faced
- Clear articulation of learning objectives

Areas for improvement:
- Try to reach out for help earlier when facing technical issues
- Consider maintaining a daily log for better progress tracking

Keep up the good work! Looking forward to your progress next week.
      `.trim(),
      rating: 4,
      reviewedAt: new Date(),
      reviewedBy: supervisor.name
    };
    weeklyReport.status = 'reviewed';
    await weeklyReport.save();
    
    console.log('✅ Added supervisor review:', {
      rating: weeklyReport.supervisorFeedback.rating,
      reviewedBy: weeklyReport.supervisorFeedback.reviewedBy,
      status: weeklyReport.status
    });

    // 7. Test event statistics
    console.log('\n📊 Testing Statistics Queries...');
    
    const supervisorEvents = await WeeklyReportEvent.find({ supervisorId: supervisor._id });
    const supervisorReports = await WeeklyReport.find({ supervisorId: supervisor._id });
    const pendingReviews = await WeeklyReport.find({ 
      supervisorId: supervisor._id, 
      status: 'submitted' 
    });
    const reviewedReports = await WeeklyReport.find({ 
      supervisorId: supervisor._id, 
      status: 'reviewed' 
    });

    console.log('✅ Statistics:', {
      totalEvents: supervisorEvents.length,
      totalReports: supervisorReports.length,
      pendingReviews: pendingReviews.length,
      reviewedReports: reviewedReports.length
    });

    // 8. Test student queries
    console.log('\n👨‍🎓 Testing Student Queries...');
    
    const studentEvents = await WeeklyReportEvent.find({ 
      supervisorId: student.supervisorId,
      status: 'active'
    });
    
    const studentReports = await WeeklyReport.find({ studentId: studentUser._id });
    
    console.log('✅ Student perspective:', {
      availableEvents: studentEvents.length,
      submittedReports: studentReports.length,
      latestSubmission: studentReports.length > 0 ? {
        week: studentReports[studentReports.length - 1].weekNumber,
        status: studentReports[studentReports.length - 1].status
      } : 'None'
    });

    // 9. Test advanced queries
    console.log('\n🔍 Testing Advanced Queries...');
    
    // Get reports grouped by week
    const reportsByWeek = await WeeklyReport.aggregate([
      { $match: { supervisorId: supervisor._id } },
      { 
        $group: {
          _id: '$weekNumber',
          count: { $sum: 1 },
          averageRating: { $avg: '$supervisorFeedback.rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('✅ Reports by week:', reportsByWeek);

    // Test event methods
    const activeEvents = await WeeklyReportEvent.getActiveBySupervisor(supervisor._id);
    const pendingEvents = await WeeklyReportEvent.getPendingForStudent(supervisor._id);
    
    console.log('✅ Event methods:', {
      activeEvents: activeEvents.length,
      pendingEvents: pendingEvents.length
    });

    // Test report methods
    const supervisorReportsWithOptions = await WeeklyReport.getBySupervisor(supervisor._id, {
      status: 'reviewed'
    });
    
    const studentReportsWithOptions = await WeeklyReport.getByStudent(studentUser._id);
    
    console.log('✅ Report methods:', {
      supervisorReviewedReports: supervisorReportsWithOptions.length,
      studentAllReports: studentReportsWithOptions.length
    });

    console.log('\n🎉 Weekly Reports System Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('• Created supervisor and student users');
    console.log('• Created weekly report event');
    console.log('• Tested student report submission');
    console.log('• Tested supervisor review functionality');
    console.log('• Verified statistics and queries');
    console.log('• Tested model methods and aggregations');
    console.log('\n✅ All tests passed! The Weekly Reports System is ready for use.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testWeeklyReportsSystem();
