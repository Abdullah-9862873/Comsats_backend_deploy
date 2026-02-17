const mongoose = require('mongoose');
const JoiningReport = require('../models/JoiningReport');
const WeeklyReport = require('../models/WeeklyReport');
const WeeklyReportEvent = require('../models/WeeklyReportEvent');
const InternshipReport = require('../models/InternshipReport');
const CompletionCertificate = require('../models/CompletionCertificate');
const User = require('../models/User');
const Student = require('../models/Student');
const Application = require('../models/Application');
require('dotenv').config();

// Student thoughts for joining reports
const studentThoughtsTemplates = [
  "I am extremely excited to begin my internship journey at {company}. This opportunity represents a significant milestone in my academic career, and I am eager to apply the theoretical knowledge I've gained at COMSATS University in a real-world setting. I look forward to learning from experienced professionals and contributing meaningfully to the team's projects.",
  
  "Starting my internship at {company} fills me with enthusiasm and determination. I believe this experience will be transformative for my career development. I am committed to working hard, learning new skills, and making the most of every opportunity that comes my way during this internship period.",
  
  "I am grateful for the opportunity to intern at {company}. This marks the beginning of my professional journey, and I am ready to embrace all the challenges and learning experiences that await me. I am particularly excited about working with cutting-edge technologies and industry experts.",
  
  "As I embark on this internship at {company}, I am filled with a sense of purpose and anticipation. I understand the importance of this practical experience in shaping my future career. I am committed to demonstrating professionalism, dedication, and a strong work ethic throughout my internship.",
  
  "Joining {company} as an intern is a dream come true for me. I have always admired the company's innovative approach and commitment to excellence. I am ready to contribute my skills and knowledge while learning from the talented team members at the organization."
];

// Weekly report content templates
const tasksCompletedTemplates = [
  "This week, I successfully completed the implementation of the user authentication module using JWT tokens. I also worked on database optimization queries that improved response times by 40%. Additionally, I participated in code reviews and helped document the API endpoints for the team.",
  
  "During this week, I focused on frontend development tasks including creating responsive UI components using React. I implemented form validation, integrated REST APIs, and fixed several bug reports. I also attended team meetings and contributed to sprint planning sessions.",
  
  "My primary accomplishments this week include developing automated test cases for the payment module, refactoring legacy code for better maintainability, and setting up CI/CD pipelines. I also collaborated with senior developers on architecture decisions.",
  
  "This week, I completed the mobile app feature for push notifications, integrated third-party analytics SDK, and optimized image loading for better performance. I also documented the implementation process and created user guides.",
  
  "I achieved several milestones this week: completed the dashboard analytics module, implemented data visualization charts, created export functionality for reports, and conducted user acceptance testing with stakeholders."
];

const challengesFacedTemplates = [
  "The main challenge I faced this week was understanding the legacy codebase architecture. However, through careful analysis and guidance from my mentor, I was able to navigate through the complex code structure and make meaningful contributions.",
  
  "I encountered difficulties with integrating the third-party payment gateway due to documentation inconsistencies. I resolved this by reaching out to the vendor support and experimenting with different configuration options.",
  
  "Time management was challenging this week as I had to balance multiple tasks simultaneously. I learned to prioritize effectively and break down large tasks into smaller, manageable chunks.",
  
  "The most significant challenge was debugging a complex asynchronous issue in the application. I used various debugging tools and logging mechanisms to identify and resolve the root cause.",
  
  "I faced challenges with cross-browser compatibility issues in the frontend. I researched best practices and implemented polyfills and fallbacks to ensure consistent behavior across browsers."
];

const reflectionsTemplates = [
  "This week has been incredibly educational. I've learned the importance of writing clean, maintainable code and the value of proper documentation. The feedback from my supervisor has helped me improve my coding practices significantly.",
  
  "I've grown both technically and professionally this week. Working in a team environment has taught me the importance of communication and collaboration. I'm becoming more confident in expressing my ideas during meetings.",
  
  "Reflecting on this week, I realize how much I've progressed since the start of my internship. The real-world experience is invaluable, and I'm grateful for the patient mentorship I've received from the team.",
  
  "This week reinforced my passion for software development. Seeing my code go into production and being used by actual users is incredibly rewarding. I'm motivated to continue learning and improving.",
  
  "I've learned that problem-solving in a professional environment requires patience and systematic thinking. The challenges I faced this week have made me a better developer and a more resilient professional."
];

const plansForNextWeekTemplates = [
  "Next week, I plan to complete the remaining API endpoints for the project module, start working on the notification system, and participate in the upcoming sprint review. I also want to explore unit testing frameworks.",
  
  "My goals for next week include finishing the user profile feature, implementing search functionality, and conducting code refactoring for better performance. I also plan to attend the knowledge sharing session.",
  
  "I aim to complete the integration testing for the current module, begin development on the reporting dashboard, and improve my understanding of the deployment process. I'll also work on documentation.",
  
  "For the coming week, I plan to focus on performance optimization, implement caching mechanisms, and work on the mobile responsiveness of the application. I also want to learn more about database indexing.",
  
  "Next week's priorities include completing the feedback system implementation, bug fixing based on QA reports, and preparing the demo for the client presentation. I also plan to explore containerization with Docker."
];

// Internship report content templates
const acknowledgementTemplates = [
  "I would like to express my sincere gratitude to {company} for providing me with this invaluable internship opportunity. Special thanks to my supervisor {supervisor} for their constant guidance and mentorship throughout this journey. I am also grateful to COMSATS University for facilitating this industry exposure.",
  
  "I extend my heartfelt thanks to the entire team at {company} for their unwavering support and encouragement. This internship has been a transformative experience, and I owe much of my learning to the collaborative environment fostered by the organization.",
  
  "My sincere appreciation goes to {supervisor} and the {company} team for their patience and dedication in nurturing my professional growth. I am thankful for every learning opportunity and the trust placed in me during this internship."
];

const executiveSummaryTemplates = [
  "This internship report documents my 12-week journey at {company}, where I worked as a {position} in the {department} department. During this period, I contributed to multiple projects, developed technical skills, and gained valuable industry experience that has prepared me for a successful career in the field.",
  
  "This report provides a comprehensive overview of my internship experience at {company}. Over the course of my internship, I was involved in various projects ranging from software development to quality assurance. This document highlights my contributions, learnings, and the overall impact of this experience on my professional development.",
  
  "The following report encapsulates my internship experience at {company}, detailing the projects I worked on, skills I acquired, and challenges I overcame. This internship has been instrumental in bridging the gap between academic knowledge and practical application."
];

const projectRequirementsTemplates = [
  "The primary project I was assigned involved developing a web-based application for customer management. Requirements included user authentication, role-based access control, CRUD operations for customer data, reporting capabilities, and integration with existing systems.",
  
  "My main project focused on creating a mobile-responsive dashboard for data analytics. The requirements specified real-time data visualization, customizable widgets, export functionality, and seamless integration with multiple data sources.",
  
  "I was tasked with developing an API gateway for microservices architecture. Requirements included request routing, authentication, rate limiting, logging, and documentation of all endpoints using OpenAPI specifications."
];

const approachAndToolsTemplates = [
  "I followed Agile methodology with two-week sprints. Technologies used included React.js for frontend, Node.js with Express for backend, MongoDB for database, and Docker for containerization. Version control was managed using Git with GitLab CI/CD for deployments.",
  
  "The project was developed using a test-driven development approach. I utilized Python with Django framework, PostgreSQL database, Redis for caching, and AWS services for cloud infrastructure. Jenkins was used for continuous integration.",
  
  "I employed a component-based architecture using Vue.js, coupled with a RESTful API built on Java Spring Boot. MySQL was used for data persistence, and the application was deployed on Azure cloud platform."
];

const outcomesAchievedTemplates = [
  "Successfully delivered the project on schedule with all required features implemented. The application showed a 35% improvement in user engagement and reduced manual processing time by 60%. Received positive feedback from stakeholders during the final presentation.",
  
  "Completed all assigned modules with 95% test coverage. The implemented solutions improved system performance by 40% and reduced bug reports by 50%. The project was adopted as a template for future development initiatives.",
  
  "Achieved all project milestones and delivered a production-ready application. The system now handles 10,000+ daily active users and has maintained 99.9% uptime since deployment."
];

const knowledgeAcquiredTemplates = [
  "I gained deep understanding of software development lifecycle, database design principles, API development best practices, cloud computing concepts, and agile project management methodologies.",
  
  "This internship enhanced my knowledge of enterprise architecture, microservices patterns, DevOps practices, security best practices, and performance optimization techniques.",
  
  "I acquired comprehensive knowledge of full-stack development, including frontend frameworks, backend technologies, database management, testing strategies, and deployment automation."
];

const skillsLearnedTemplates = [
  "Technical skills developed include proficiency in React.js, Node.js, MongoDB, Docker, Git, and AWS services. I also improved my debugging, code review, and technical documentation skills.",
  
  "I enhanced my skills in Python, Django, PostgreSQL, Redis, Jenkins, and Linux system administration. Additionally, I developed strong analytical and problem-solving abilities.",
  
  "Skills acquired include Vue.js, Java Spring Boot, MySQL, Azure cloud services, and agile tools like Jira and Confluence. I also strengthened my communication and presentation skills."
];

const attitudesAndValuesTemplates = [
  "This internship instilled in me the values of professionalism, integrity, and continuous learning. I learned the importance of teamwork, meeting deadlines, and maintaining work-life balance.",
  
  "I developed a growth mindset and learned to embrace challenges as learning opportunities. The experience taught me the value of constructive feedback and collaborative problem-solving.",
  
  "I cultivated attitudes of responsibility, accountability, and proactive communication. I now understand the importance of adaptability and resilience in a professional environment."
];

const challengingTaskTemplates = [
  "The most challenging task was optimizing a complex database query that was causing performance issues. After extensive analysis and consultation with senior developers, I successfully refactored the query, reducing execution time from 30 seconds to under 2 seconds.",
  
  "I faced a significant challenge when integrating legacy systems with modern APIs. Through systematic debugging, documentation review, and creative problem-solving, I developed a robust integration layer that bridged the technology gap.",
  
  "The most demanding task was implementing real-time synchronization across multiple devices. I researched WebSocket technologies and eventually implemented a solution using Socket.io that met all performance requirements."
];

const challengesAndSolutionsTemplates = [
  "Throughout my internship, I encountered challenges ranging from technical debugging to time management. For each challenge, I adopted a systematic approach: identify the problem, research solutions, consult with mentors, implement the fix, and document the learning.",
  
  "Key challenges included adapting to new technologies, managing multiple priorities, and working under tight deadlines. I addressed these by dedicating time to self-learning, using task management tools, and maintaining clear communication with my supervisor.",
  
  "I overcame challenges related to code complexity, team coordination, and scope changes by maintaining flexibility, seeking feedback regularly, and staying focused on project objectives."
];

const reflectionAndConclusionTemplates = [
  "This internship has been a transformative experience that exceeded my expectations. I have grown both technically and professionally, and I am confident that the skills and knowledge gained will serve me well in my future career. I am grateful for this opportunity and look forward to applying my learnings in future endeavors.",
  
  "Looking back at my internship journey, I can see significant personal and professional growth. The hands-on experience, mentorship, and exposure to industry practices have prepared me to take on real-world challenges. This internship has confirmed my passion for technology and strengthened my commitment to excellence.",
  
  "In conclusion, this internship has been an invaluable stepping stone in my career development. The practical experience complemented my academic learning perfectly, and I now have a clearer vision of my professional path. I extend my gratitude to everyone who contributed to making this experience memorable and educational."
];

// Company names
const companyNames = [
  'Tech Pro', 'Digital Innovations Ltd', 'CodeCraft Studios', 'TechCorp Solutions',
  'Nexus Technologies', 'Innovation Hub', 'Digital Dynamics', 'Future Tech',
  'Smart Solutions Inc', 'CloudFirst Technologies'
];

// Positions
const positions = [
  'Software Developer Intern', 'Frontend Developer', 'Backend Developer', 
  'Full Stack Developer', 'Mobile App Developer', 'Data Analyst Intern',
  'QA Engineer Intern', 'DevOps Intern', 'UI/UX Designer Intern', 'ML Engineer Intern'
];

// Departments
const studentDepartments = [
  'Computer Science', 'Software Engineering', 'Information Technology',
  'Electrical Engineering', 'Business Administration'
];

// Grades
const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C'];

// Generate random date within range
const generateDate = (daysAgo, daysRange = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo + Math.floor(Math.random() * daysRange));
  return date;
};

// Generate random future date
const generateFutureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
  return date;
};

// Generate certificate number
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}${month}-${random}`;
};

async function seedAllReports() {
  try {
    console.log('🌱 Starting Reports seeding process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected for seeding');

    // Get all students with user records
    const students = await Student.find({ isActive: true }).limit(60);
    if (students.length === 0) {
      console.log('❌ No students found. Please run seedJobApplications.js first.');
      return;
    }
    console.log(`👨‍🎓 Found ${students.length} students`);

    // Get supervisors
    const supervisors = await User.find({ role: 'supervisor', isVerified: true });
    if (supervisors.length === 0) {
      console.log('❌ No supervisors found. Please run seedCompanies.js first.');
      return;
    }
    console.log(`👨‍🏫 Found ${supervisors.length} supervisors`);

    // Get companies
    const companies = await User.find({ role: 'company', isVerified: true });
    if (companies.length === 0) {
      console.log('❌ No companies found. Please run seedCompanies.js first.');
      return;
    }
    console.log(`🏢 Found ${companies.length} companies`);

    // =====================================================
    // SEED JOINING REPORTS
    // =====================================================
    console.log('\n📋 Seeding Joining Reports...');
    let joiningReportCount = 0;
    const joiningStatuses = ['Pending Review', 'Verified'];

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const status = joiningStatuses[Math.floor(Math.random() * joiningStatuses.length)];

      // Get user record for student
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) continue;

      // Check if joining report already exists
      const existingReport = await JoiningReport.findOne({ studentId: studentUser._id });
      if (existingReport) continue;

      const internshipStart = generateDate(60, 30);
      const internshipEnd = new Date(internshipStart);
      internshipEnd.setDate(internshipEnd.getDate() + 90);

      const studentThoughts = studentThoughtsTemplates[Math.floor(Math.random() * studentThoughtsTemplates.length)]
        .replace('{company}', company.name);

      const joiningReport = new JoiningReport({
        studentId: studentUser._id,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        companyId: company._id,
        companyName: company.name,
        position: position,
        department: student.department,
        supervisorId: supervisor._id,
        supervisorName: supervisor.name,
        supervisorEmail: supervisor.email,
        internshipStart: internshipStart,
        internshipEnd: internshipEnd,
        reportDate: generateDate(30),
        studentThoughts: studentThoughts,
        acknowledgment: true,
        status: status
      });

      await joiningReport.save();
      joiningReportCount++;
      console.log(`   ✅ Created Joining Report #${joiningReportCount}: ${student.fullName} at ${company.name} [${status}]`);
    }

    // =====================================================
    // SEED WEEKLY REPORT EVENTS FIRST
    // =====================================================
    console.log('\n📅 Seeding Weekly Report Events...');
    let eventCount = 0;

    for (const supervisor of supervisors) {
      for (let week = 1; week <= 8; week++) {
        // Check if event already exists
        const existingEvent = await WeeklyReportEvent.findOne({
          supervisorId: supervisor._id,
          weekNumber: week
        });
        if (existingEvent) continue;

        const weekStartDate = new Date();
        weekStartDate.setDate(weekStartDate.getDate() - (8 - week) * 7);
        
        const dueDate = new Date(weekStartDate);
        dueDate.setDate(dueDate.getDate() + 7);

        const event = new WeeklyReportEvent({
          supervisorId: supervisor._id,
          supervisorName: supervisor.name,
          weekNumber: week,
          title: `Weekly Report - Week ${week}`,
          instructions: `Please submit your weekly progress report for Week ${week}. Include tasks completed, challenges faced, and plans for next week.`,
          weekStartDate: weekStartDate,
          dueDate: dueDate,
          status: week <= 6 ? 'completed' : 'active'
        });

        await event.save();
        eventCount++;
      }
    }
    console.log(`   ✅ Created ${eventCount} Weekly Report Events`);

    // =====================================================
    // SEED WEEKLY REPORTS
    // =====================================================
    console.log('\n📊 Seeding Weekly Reports...');
    let weeklyReportCount = 0;
    const weeklyStatuses = ['submitted', 'reviewed', 'requires_revision'];
    const ratings = [3, 4, 5, 4, 5, 4, 3, 5];

    // Get all events
    const allEvents = await WeeklyReportEvent.find({});

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const weekNumber = (i % 8) + 1;

      // Get user record for student
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) continue;

      // Get the event for this supervisor and week
      const event = await WeeklyReportEvent.findOne({
        supervisorId: supervisor._id,
        weekNumber: weekNumber
      });
      if (!event) continue;

      // Check if weekly report already exists
      const existingReport = await WeeklyReport.findOne({
        studentId: studentUser._id,
        weekEventId: event._id
      });
      if (existingReport) continue;

      const status = weeklyStatuses[Math.floor(Math.random() * weeklyStatuses.length)];
      const rating = ratings[Math.floor(Math.random() * ratings.length)];

      const weeklyReport = new WeeklyReport({
        studentId: studentUser._id,
        studentName: student.fullName,
        studentRollNo: student.rollNumber,
        supervisorId: supervisor._id,
        supervisorName: supervisor.name,
        weekEventId: event._id,
        weekNumber: weekNumber,
        weekStartDate: event.weekStartDate,
        reportTitle: `Week ${weekNumber} Progress Report - ${student.fullName}`,
        tasksCompleted: tasksCompletedTemplates[Math.floor(Math.random() * tasksCompletedTemplates.length)],
        challengesFaced: challengesFacedTemplates[Math.floor(Math.random() * challengesFacedTemplates.length)],
        reflections: reflectionsTemplates[Math.floor(Math.random() * reflectionsTemplates.length)],
        supportingMaterials: 'Code commits, documentation, and meeting notes attached.',
        plansForNextWeek: plansForNextWeekTemplates[Math.floor(Math.random() * plansForNextWeekTemplates.length)],
        companyName: company.name,
        companyLocation: 'Islamabad, Pakistan',
        status: status,
        submittedAt: generateDate(weekNumber * 7),
        dueDate: event.dueDate,
        supervisorFeedback: status === 'reviewed' ? {
          feedback: 'Good progress this week. Keep up the excellent work and continue to improve your documentation skills.',
          rating: rating,
          reviewedAt: generateDate((weekNumber * 7) - 2),
          reviewedBy: supervisor.name
        } : {},
        submissionMetadata: {
          submissionMethod: 'web'
        }
      });

      await weeklyReport.save();
      weeklyReportCount++;
      console.log(`   ✅ Created Weekly Report #${weeklyReportCount}: ${student.fullName} - Week ${weekNumber} [${status}]`);
    }

    // =====================================================
    // SEED INTERNSHIP REPORTS
    // =====================================================
    console.log('\n📄 Seeding Internship Reports...');
    let internshipReportCount = 0;
    const internshipStatuses = ['submitted', 'reviewed', 'approved'];

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const status = internshipStatuses[Math.floor(Math.random() * internshipStatuses.length)];

      // Get user record for student
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) continue;

      // Check if internship report already exists
      const existingReport = await InternshipReport.findOne({ studentId: studentUser._id });
      if (existingReport) continue;

      const acknowledgement = acknowledgementTemplates[Math.floor(Math.random() * acknowledgementTemplates.length)]
        .replace('{company}', company.name)
        .replace('{supervisor}', supervisor.name);

      const executiveSummary = executiveSummaryTemplates[Math.floor(Math.random() * executiveSummaryTemplates.length)]
        .replace('{company}', company.name)
        .replace('{position}', position)
        .replace('{department}', student.department);

      const internshipReport = new InternshipReport({
        studentId: studentUser._id,
        supervisorId: supervisor._id,
        companyId: company._id,
        acknowledgement: acknowledgement,
        executiveSummary: executiveSummary,
        tableOfContents: `1. Acknowledgement\n2. Executive Summary\n3. Introduction\n4. Company Overview\n5. Project Requirements\n6. Approach and Tools\n7. Outcomes Achieved\n8. Learning Experiences\n9. Challenges and Solutions\n10. Conclusion\n11. Appendices`,
        projectRequirements: projectRequirementsTemplates[Math.floor(Math.random() * projectRequirementsTemplates.length)],
        approachAndTools: approachAndToolsTemplates[Math.floor(Math.random() * approachAndToolsTemplates.length)],
        outcomesAchieved: outcomesAchievedTemplates[Math.floor(Math.random() * outcomesAchievedTemplates.length)],
        knowledgeAcquired: knowledgeAcquiredTemplates[Math.floor(Math.random() * knowledgeAcquiredTemplates.length)],
        skillsLearned: skillsLearnedTemplates[Math.floor(Math.random() * skillsLearnedTemplates.length)],
        attitudesAndValues: attitudesAndValuesTemplates[Math.floor(Math.random() * attitudesAndValuesTemplates.length)],
        challengingTask: challengingTaskTemplates[Math.floor(Math.random() * challengingTaskTemplates.length)],
        challengesAndSolutions: challengesAndSolutionsTemplates[Math.floor(Math.random() * challengesAndSolutionsTemplates.length)],
        reflectionAndConclusion: reflectionAndConclusionTemplates[Math.floor(Math.random() * reflectionAndConclusionTemplates.length)],
        appendices: [
          {
            filename: `appendix_${i}_code_samples.pdf`,
            originalName: 'Code_Samples_and_Documentation.pdf',
            path: `/uploads/internship-reports/appendix_${i}_code_samples.pdf`,
            size: Math.floor(500000 + Math.random() * 1000000),
            mimeType: 'application/pdf',
            uploadedAt: generateDate(10)
          }
        ],
        status: status,
        submittedAt: generateDate(20),
        reviewedAt: status !== 'submitted' ? generateDate(15) : null,
        supervisorFeedback: status !== 'submitted' ? 'Excellent work! The report is comprehensive and well-structured. Good documentation of learning experiences.' : null,
        grade: status === 'approved' ? grades[Math.floor(Math.random() * grades.length)] : null
      });

      await internshipReport.save();
      internshipReportCount++;
      console.log(`   ✅ Created Internship Report #${internshipReportCount}: ${student.fullName} [${status}]`);
    }

    // =====================================================
    // SEED COMPLETION CERTIFICATES
    // =====================================================
    console.log('\n🎓 Seeding Completion Certificates...');
    let certificateCount = 0;
    const certificateStatuses = ['submitted', 'under-review', 'approved', 'rejected'];

    for (let i = 0; i < 55; i++) {
      const student = students[i % students.length];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const status = certificateStatuses[Math.floor(Math.random() * certificateStatuses.length)];

      // Get user record for student
      const studentUser = await User.findOne({ email: student.email, role: 'student' });
      if (!studentUser) continue;

      // Check if certificate already exists
      const existingCert = await CompletionCertificate.findOne({ studentId: studentUser._id });
      if (existingCert) continue;

      const internshipStart = generateDate(100, 20);
      const internshipEnd = new Date(internshipStart);
      internshipEnd.setDate(internshipEnd.getDate() + 90);

      const certificate = new CompletionCertificate({
        studentId: studentUser._id,
        studentName: student.fullName,
        studentEmail: student.email,
        studentRollNumber: student.rollNumber,
        companyId: company._id,
        companyName: company.name,
        companySupervisor: supervisor.name,
        supervisorEmail: supervisor.email,
        internshipStartDate: internshipStart,
        internshipEndDate: internshipEnd,
        internshipDuration: '12 weeks (84 days)',
        department: student.department,
        designation: position,
        reportSummary: `During my ${position} internship at ${company.name}, I successfully completed multiple projects and contributed to the team's goals. I developed strong technical skills and gained valuable industry experience that has prepared me for a successful career in the field. This internship has been an invaluable learning experience.`,
        keyAchievements: `1. Successfully delivered 3 major project modules on schedule\n2. Improved application performance by 40%\n3. Received positive feedback from stakeholders\n4. Implemented automated testing with 90% coverage\n5. Contributed to documentation and knowledge sharing`,
        futurePlans: `I plan to continue developing my skills in software development and pursue advanced certifications. My goal is to secure a full-time position in the technology industry and eventually lead development teams. I am committed to lifelong learning and professional growth.`,
        technicalSkills: 'JavaScript, React.js, Node.js, MongoDB, Git, Docker, AWS, Agile Methodologies',
        softSkills: 'Communication, Teamwork, Problem-solving, Time Management, Adaptability, Leadership',
        overallLearning: `This internship provided comprehensive exposure to real-world software development practices. I learned to work in a professional team environment, manage deadlines effectively, and deliver high-quality solutions. The experience has significantly enhanced my technical and professional capabilities.`,
        projectsCompleted: `1. Customer Management System - Full-stack web application\n2. API Gateway Implementation - Microservices architecture\n3. Analytics Dashboard - Data visualization module\n4. Automated Testing Framework - Quality assurance`,
        performanceRating: Math.floor(3 + Math.random() * 3),
        recommendationLetter: `I highly recommend ${student.fullName} for any software development position. During their internship, they demonstrated exceptional technical skills, professionalism, and dedication. They consistently delivered high-quality work and showed remarkable growth throughout the program.`,
        certificateFile: `/uploads/certificates/cert_${i}.pdf`,
        appraisalForm: `/uploads/appraisals/appraisal_${i}.pdf`,
        status: status,
        submittedAt: generateDate(15),
        certificateNumber: generateCertificateNumber()
      });

      // Only add optional fields if they have values
      if (status !== 'submitted') {
        certificate.reviewedAt = generateDate(10);
        certificate.reviewedBy = supervisor._id;
        certificate.supervisorComments = 'The student showed great dedication and professional attitude.';
      }
      if (status === 'approved') {
        certificate.supervisorFeedback = 'Excellent performance throughout the internship. Highly recommended for future opportunities.';
        certificate.supervisorGrade = grades[Math.floor(Math.random() * grades.length)];
        certificate.issuedDate = generateDate(5);
      }

      await certificate.save();
      certificateCount++;
      console.log(`   ✅ Created Certificate #${certificateCount}: ${student.fullName} [${status}]`);
    }

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n📊 Seeding Summary:');
    console.log('═══════════════════════════════════════');
    
    const joiningCount = await JoiningReport.countDocuments();
    const weeklyCount = await WeeklyReport.countDocuments();
    const internshipCount = await InternshipReport.countDocuments();
    const certCount = await CompletionCertificate.countDocuments();
    
    console.log(`   Joining Reports: ${joiningCount}`);
    console.log(`   Weekly Reports: ${weeklyCount}`);
    console.log(`   Internship Reports: ${internshipCount}`);
    console.log(`   Completion Certificates: ${certCount}`);
    console.log('═══════════════════════════════════════');
    
    // Status breakdown
    const joiningVerified = await JoiningReport.countDocuments({ status: 'Verified' });
    const weeklyReviewed = await WeeklyReport.countDocuments({ status: 'reviewed' });
    const internshipApproved = await InternshipReport.countDocuments({ status: 'approved' });
    const certApproved = await CompletionCertificate.countDocuments({ status: 'approved' });
    
    console.log(`   Joining Reports (Verified): ${joiningVerified}`);
    console.log(`   Weekly Reports (Reviewed): ${weeklyReviewed}`);
    console.log(`   Internship Reports (Approved): ${internshipApproved}`);
    console.log(`   Certificates (Approved): ${certApproved}`);
    console.log('═══════════════════════════════════════');
    
    console.log('\n🎉 All Reports seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding reports:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedAllReports();
