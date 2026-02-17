const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const MisconductReport = require('../models/MisconductReport');
const ProgressReport = require('../models/ProgressReport');
const InternshipAppraisal = require('../models/InternshipAppraisal');
const User = require('../models/User');
const Student = require('../models/Student');
const CompanyProfile = require('../models/CompanyProfile');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship-portal';

// Sample data arrays
const departments = [
  'Computer Science',
  'Software Engineering', 
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Information Technology',
  'Data Science',
  'Cybersecurity'
];

const issueTypes = ['Absenteeism', 'Unprofessional Behavior', 'Misconduct', 'Poor Performance', 'Policy Violation'];
const misconductStatuses = ['Pending', 'Resolved', 'Warning Issued', 'Internship Cancelled'];
const qualityLevels = ['Excellent', 'Good', 'Average', 'Poor'];
const performanceLevels = ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor'];
const recommendations = ['Highly Recommend', 'Recommend', 'Neutral', 'Do Not Recommend'];

// Misconduct descriptions (min 200 chars)
const misconductDescriptions = [
  'The intern was absent for multiple consecutive days without prior notice or approval. Despite repeated attempts to contact them via email and phone, there was no response for over a week. This behavior disrupted the team project timeline and affected deliverables. The project manager had to redistribute tasks among other team members, causing additional workload and delays.',
  
  'The intern displayed unprofessional behavior during a client meeting by using inappropriate language and interrupting senior team members multiple times. This behavior was noticed by the client representatives and caused embarrassment to the company. A formal counseling session was conducted, and the intern was warned about professional conduct expectations.',
  
  'The intern was found sharing confidential company information on social media platforms without authorization. This included internal project details and client information that was clearly marked as confidential. The security team identified the breach and immediate action was taken to mitigate potential damage. This is a serious violation of the NDA signed during onboarding.',
  
  'Repeated instances of submitting work that did not meet quality standards despite multiple feedback sessions and training. The intern failed to follow the coding guidelines, documentation standards, and review processes. Despite mentoring from senior developers, there was no significant improvement in the quality of deliverables over a 4-week period.',
  
  'The intern violated the remote work policy by working from an unauthorized location without approval. Additionally, they failed to maintain proper working hours as specified in the internship agreement. This affected team collaboration and availability during critical project phases. VPN logs confirmed irregular access patterns inconsistent with declared location.',
  
  'The intern was observed engaging in harassment behavior towards fellow interns and junior staff members. Multiple complaints were received from different team members about inappropriate comments and exclusionary behavior. HR conducted an investigation and confirmed the misconduct. Immediate disciplinary action is being recommended.',
  
  'Failure to attend mandatory training sessions and company meetings without valid reasons. The intern missed 5 out of 8 scheduled training sessions and 3 team standup meetings. This affected their skill development and integration with the team. Despite calendar reminders and personal notifications, attendance did not improve.',
  
  'The intern was found using company resources for personal projects during work hours. This included using the company laptop, software licenses, and cloud computing resources for freelance work. This is a clear violation of the company policy regarding use of company assets and conflicts with the internship agreement terms.',
  
  'Poor communication and lack of responsiveness to team members and supervisors. The intern consistently failed to reply to emails, Slack messages, and meeting invites in a timely manner. This caused delays in task handovers and affected the overall team productivity. Multiple reminders were given but the behavior persisted throughout the internship.',
  
  'The intern submitted plagiarized work copied from online sources and other team members without attribution. Code review revealed significant portions of submitted code were directly copied from Stack Overflow and GitHub repositories without proper licensing compliance. This raises serious ethical concerns about the intern\'s integrity.'
];

// Progress report templates
const tasksTemplates = [
  'Developed RESTful APIs for user authentication and authorization module. Implemented JWT-based security. Created unit tests for all endpoints.',
  'Designed and implemented frontend dashboard components using React.js. Integrated with backend APIs and added responsive design.',
  'Conducted database optimization and query performance analysis. Created indexes and optimized slow-running queries.',
  'Built automated testing framework using Jest and Cypress. Achieved 85% code coverage for critical modules.',
  'Implemented CI/CD pipeline using GitHub Actions. Set up automated deployments to staging and production environments.',
  'Developed data visualization components for analytics dashboard. Used D3.js and Chart.js for interactive charts.',
  'Created API documentation using Swagger. Wrote technical documentation for onboarding new developers.',
  'Implemented caching layer using Redis to improve application performance. Reduced API response times by 40%.',
  'Developed microservices architecture for order processing system. Implemented message queues using RabbitMQ.',
  'Built mobile-responsive landing pages and marketing website components. Optimized for SEO and performance.'
];

const progressTemplates = [
  'Successfully completed all assigned tasks within the deadline. The authentication module is now deployed and functional. Received positive feedback from the team lead.',
  'Frontend components are 90% complete. Currently working on bug fixes and UI polish. Integration testing is in progress with QA team.',
  'Database optimization resulted in 50% improvement in query performance. All critical queries now run under 100ms threshold.',
  'Testing framework is fully operational. All unit tests are passing. Integration tests coverage improved from 60% to 85%.',
  'CI/CD pipeline is fully automated. Deployment time reduced from 30 minutes to 5 minutes. Zero downtime deployments achieved.',
  'Analytics dashboard is complete with 10 different chart types. Real-time data updates working correctly. User feedback has been incorporated.',
  'API documentation is comprehensive and up-to-date. Developer onboarding time reduced by 40% based on new hire feedback.',
  'Caching implementation complete. Load testing shows system can handle 3x more concurrent users without performance degradation.',
  'Microservices are deployed and communicating correctly. Message queue handling 10,000+ messages per hour without issues.',
  'Landing pages launched successfully. PageSpeed score improved from 65 to 92. Mobile usability score at 100%.'
];

const improvementAreas = [
  'Time management and meeting deadlines more consistently',
  'Improving code documentation and commenting practices',
  'Better communication with team members during blockers',
  'Learning new technologies and staying updated with industry trends',
  'Taking more initiative in identifying and solving problems',
  'Writing more comprehensive test cases for edge scenarios',
  'Improving presentation and public speaking skills',
  'Better estimation of task complexity and effort required'
];

const nextGoalsTemplates = [
  'Complete the remaining 10% of frontend work. Start working on mobile app integration. Prepare for production deployment.',
  'Begin work on advanced features including real-time notifications. Implement WebSocket connections for live updates.',
  'Learn and implement GraphQL for flexible data querying. Migrate key APIs to GraphQL schema.',
  'Expand test coverage to 95%. Implement E2E tests for critical user journeys. Set up visual regression testing.',
  'Implement blue-green deployment strategy. Add monitoring and alerting for production issues.',
  'Add export functionality for dashboard reports. Implement scheduled report generation and email delivery.',
  'Create video tutorials for complex API integrations. Build interactive API playground for testing.',
  'Implement distributed caching for multi-region deployment. Add cache invalidation strategies.',
  'Implement saga pattern for distributed transactions. Add circuit breaker for fault tolerance.',
  'A/B testing for landing page variations. Implement analytics tracking for conversion optimization.'
];

// Appraisal templates
const keyStrengthsTemplates = [
  'Excellent problem-solving abilities and analytical thinking. Quick learner who adapts well to new technologies and frameworks. Strong attention to detail in code quality.',
  'Outstanding communication skills and team collaboration. Takes initiative in identifying issues and proposing solutions. Reliable and consistent in meeting deadlines.',
  'Strong technical skills in full-stack development. Proactive in seeking feedback and implementing improvements. Good understanding of software architecture principles.',
  'Exceptional creativity in designing user interfaces. Strong grasp of UX principles and user-centered design. Excellent documentation and code organization.',
  'Superior debugging and troubleshooting skills. Methodical approach to problem-solving. Strong foundation in computer science fundamentals.',
  'Excellent teamwork and interpersonal skills. Natural leader who helps mentor other interns. Strong work ethic and professional attitude.',
  'Outstanding research abilities and self-learning capabilities. Stays updated with latest industry trends. Contributes valuable insights during team discussions.',
  'Exceptional time management and multitasking abilities. Handles pressure well during tight deadlines. Maintains high quality even under time constraints.'
];

const areasForImprovementTemplates = [
  'Could benefit from more experience with system design and architecture decisions. Should focus on understanding trade-offs in technology choices.',
  'Need to improve estimation skills for complex tasks. Sometimes underestimates the time required for thorough testing and debugging.',
  'Should work on public speaking and presentation skills. Could be more confident when presenting work to larger groups.',
  'Could improve on asking for help earlier when facing blockers. Sometimes spends too much time on issues that could be resolved faster with collaboration.',
  'Need to develop better documentation habits. Technical writing could be more comprehensive and reader-friendly.',
  'Should focus on learning more about DevOps and deployment processes. Limited exposure to production environment management.',
  'Could benefit from deeper understanding of database optimization and scaling strategies for high-traffic applications.',
  'Should work on balancing perfectionism with practical delivery. Sometimes over-engineers solutions when simpler approaches would suffice.'
];

const feedbackTemplates = [
  'It has been an absolute pleasure working with this intern. They demonstrated exceptional growth throughout the internship period and consistently exceeded expectations. Their contributions have had a measurable positive impact on our team productivity and project outcomes. They are highly recommended for future opportunities.',
  
  'This intern showed great potential and a strong willingness to learn. While there were some initial challenges adapting to our development workflow, they quickly improved and became a valuable team member. Their final project deliverables were of high quality and well-documented.',
  
  'A solid performer who met all expectations during the internship. The intern showed good technical skills and professional conduct. They worked well with the team and contributed meaningfully to project deliverables. Would recommend for entry-level positions.',
  
  'The intern demonstrated consistent improvement throughout their tenure. They were receptive to feedback and actively worked on areas that needed development. Their positive attitude and eagerness to learn made them a great addition to the team.',
  
  'Outstanding intern who brought fresh perspectives and innovative ideas to the team. Their technical contributions, particularly in frontend development, significantly improved our product. They have the potential to become an excellent software engineer.',
  
  'This intern exceeded expectations in all areas. Their ability to quickly understand complex systems and contribute meaningfully was impressive. They showed maturity beyond their experience level and handled challenging situations professionally.',
  
  'A dedicated and hardworking intern who made significant contributions to multiple projects. Their attention to detail and commitment to quality were evident in all their work. They collaborated well with senior developers and learned quickly.',
  
  'The intern showed excellent progress in technical skills development. While there is room for improvement in certain areas, their overall performance was satisfactory. With continued learning and experience, they will become a strong developer.'
];

// Helper functions
function generateDate(daysAgo, variance = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo - Math.floor(Math.random() * variance));
  return date;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedCompanyRequestsData() {
  try {
    console.log('🌱 Starting Company Requests data seeding...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected for seeding');

    // Get existing users, students, and companies
    const students = await Student.find({}).limit(60);
    const supervisors = await User.find({ role: 'supervisor' }).limit(10);
    const companies = await CompanyProfile.find({}).limit(10);

    console.log(`👨‍🎓 Found ${students.length} students`);
    console.log(`👨‍🏫 Found ${supervisors.length} supervisors`);
    console.log(`🏢 Found ${companies.length} companies`);

    if (students.length === 0 || supervisors.length === 0 || companies.length === 0) {
      console.log('⚠️ Insufficient data. Creating sample company data...');
      
      // Create sample company if none exists
      if (companies.length === 0) {
        const companyUser = await User.findOne({ role: 'company' });
        if (companyUser) {
          const newCompany = new CompanyProfile({
            userId: companyUser._id,
            name: 'TechCorp Solutions',
            industry: 'Information Technology',
            email: companyUser.email
          });
          await newCompany.save();
          companies.push(newCompany);
        }
      }
    }

    // =====================================================
    // SEED MISCONDUCT REPORTS (50+)
    // =====================================================
    console.log('\n🚨 Seeding Misconduct Reports...');
    let misconductCount = 0;

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const status = getRandomElement(misconductStatuses);
      const issueType = getRandomElement(issueTypes);

      // Check for existing misconduct report
      const existingReport = await MisconductReport.findOne({ 
        studentId: student._id,
        incidentDate: { $gte: generateDate(30) }
      });
      if (existingReport) continue;

      const misconductReport = new MisconductReport({
        studentId: student._id,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        companyId: company._id,
        companyName: company.companyName || company.name || 'Tech Company',
        supervisorId: supervisor._id,
        supervisorName: supervisor.fullName || supervisor.name || 'Company Supervisor',
        issueType: issueType,
        incidentDate: generateDate(Math.floor(Math.random() * 60), 10),
        description: getRandomElement(misconductDescriptions),
        status: status,
        supervisorComments: status !== 'Pending' ? `This issue has been addressed. ${issueType} case handled according to company policy.` : '',
        resolvedAt: status === 'Resolved' ? generateDate(5) : undefined
      });

      await misconductReport.save();
      misconductCount++;
      console.log(`   ✅ Created Misconduct Report #${misconductCount}: ${student.fullName} - ${issueType} [${status}]`);
    }

    // =====================================================
    // SEED PROGRESS REPORTS (50+)
    // =====================================================
    console.log('\n📈 Seeding Progress Reports...');
    let progressCount = 0;
    const reportingPeriods = [
      'Week 1-2', 'Week 3-4', 'Week 5-6', 'Week 7-8',
      'Month 1', 'Month 2', 'Month 3',
      'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'
    ];
    const progressStatuses = ['Submitted', 'Reviewed'];

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const status = getRandomElement(progressStatuses);
      const quality = getRandomElement(qualityLevels);
      const period = getRandomElement(reportingPeriods);

      // Get student user
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) continue;

      // Check for duplicate
      const existingReport = await ProgressReport.findOne({
        studentId: studentUser._id,
        reportingPeriod: period
      });
      if (existingReport) continue;

      const progressReport = new ProgressReport({
        studentId: studentUser._id,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        department: student.department || getRandomElement(departments),
        companyId: company.userId || company._id,
        companyName: company.companyName || company.name || 'Tech Company',
        supervisorId: supervisor._id,
        supervisorName: supervisor.fullName || supervisor.name || 'Supervisor',
        reportingPeriod: period,
        tasksAssigned: getRandomElement(tasksTemplates),
        progressMade: getRandomElement(progressTemplates),
        hoursWorked: Math.floor(30 + Math.random() * 50),
        qualityOfWork: quality,
        areasOfImprovement: getRandomElement(improvementAreas),
        nextGoals: getRandomElement(nextGoalsTemplates),
        remarks: `Overall ${quality.toLowerCase()} performance during ${period}. Student shows dedication and commitment to learning.`,
        reportType: 'Progress',
        status: status,
        supervisorFeedback: status === 'Reviewed' ? `Good progress during ${period}. Keep up the excellent work and focus on the improvement areas mentioned.` : '',
        reviewedAt: status === 'Reviewed' ? generateDate(3) : undefined
      });

      await progressReport.save();
      progressCount++;
      console.log(`   ✅ Created Progress Report #${progressCount}: ${student.fullName} - ${period} [${status}]`);
    }

    // =====================================================
    // SEED INTERNSHIP APPRAISALS (50+)
    // =====================================================
    console.log('\n⭐ Seeding Internship Appraisals...');
    let appraisalCount = 0;
    const appraisalStatuses = ['submitted', 'reviewed', 'archived'];
    const durations = ['4 weeks', '6 weeks', '8 weeks', '10 weeks', '12 weeks', '3 months', '6 months'];
    const internshipTitles = [
      'Software Development Intern',
      'Frontend Developer Intern',
      'Backend Developer Intern',
      'Full Stack Developer Intern',
      'Data Science Intern',
      'Machine Learning Intern',
      'DevOps Engineer Intern',
      'QA Engineer Intern',
      'UI/UX Design Intern',
      'Mobile App Developer Intern',
      'Cloud Engineering Intern',
      'Cybersecurity Intern'
    ];

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const status = getRandomElement(appraisalStatuses);
      const performance = getRandomElement(performanceLevels);
      const recommendation = getRandomElement(recommendations);

      // Get student user
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) continue;

      // Check for existing appraisal
      const existingAppraisal = await InternshipAppraisal.findOne({
        studentId: studentUser._id,
        companyId: company.userId || company._id
      });
      if (existingAppraisal) continue;

      const appraisal = new InternshipAppraisal({
        studentId: studentUser._id,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        internshipTitle: getRandomElement(internshipTitles),
        duration: getRandomElement(durations),
        companyId: company.userId || company._id,
        companyName: company.companyName || company.name || 'Tech Company',
        overallPerformance: performance,
        rating: Math.floor(5 + Math.random() * 5) + 1, // 6-10
        keyStrengths: getRandomElement(keyStrengthsTemplates),
        areasForImprovement: getRandomElement(areasForImprovementTemplates),
        commentsAndFeedback: getRandomElement(feedbackTemplates),
        recommendation: recommendation,
        attachments: [
          {
            filename: `appraisal_${i}_form.pdf`,
            originalName: 'Performance_Appraisal_Form.pdf',
            path: `/uploads/appraisals/appraisal_${i}_form.pdf`,
            mimetype: 'application/pdf',
            size: Math.floor(100000 + Math.random() * 200000),
            uploadedAt: generateDate(10)
          }
        ],
        submittedBy: supervisor.fullName || supervisor.name || 'Company Supervisor',
        submittedByEmail: supervisor.email,
        submissionDate: generateDate(15, 10),
        status: status,
        reviewedBy: status !== 'submitted' ? supervisor._id : undefined,
        reviewDate: status !== 'submitted' ? generateDate(5) : undefined,
        reviewComments: status !== 'submitted' ? 'Appraisal reviewed and acknowledged. Feedback has been shared with the academic supervisor.' : undefined
      });

      await appraisal.save();
      appraisalCount++;
      console.log(`   ✅ Created Appraisal #${appraisalCount}: ${student.fullName} - ${performance} [${status}]`);
    }

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n📊 Seeding Summary:');
    console.log('═══════════════════════════════════════');
    
    const totalMisconduct = await MisconductReport.countDocuments();
    const totalProgress = await ProgressReport.countDocuments();
    const totalAppraisals = await InternshipAppraisal.countDocuments();
    
    console.log(`   Misconduct Reports: ${totalMisconduct}`);
    console.log(`   Progress Reports: ${totalProgress}`);
    console.log(`   Internship Appraisals: ${totalAppraisals}`);
    console.log('═══════════════════════════════════════');
    
    // Status breakdown
    const misconductPending = await MisconductReport.countDocuments({ status: 'Pending' });
    const misconductResolved = await MisconductReport.countDocuments({ status: 'Resolved' });
    const progressReviewed = await ProgressReport.countDocuments({ status: 'Reviewed' });
    const appraisalsReviewed = await InternshipAppraisal.countDocuments({ status: 'reviewed' });
    
    console.log(`   Misconduct Reports (Pending): ${misconductPending}`);
    console.log(`   Misconduct Reports (Resolved): ${misconductResolved}`);
    console.log(`   Progress Reports (Reviewed): ${progressReviewed}`);
    console.log(`   Appraisals (Reviewed): ${appraisalsReviewed}`);
    console.log('═══════════════════════════════════════');
    
    console.log('\n🎉 Company Requests data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding
seedCompanyRequestsData();
