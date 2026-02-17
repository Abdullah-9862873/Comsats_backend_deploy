const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Job = require('../models/Job');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship-portal';

// Sample data arrays
const jobTitles = [
  'Full Stack Developer Intern',
  'Frontend Developer Intern',
  'Backend Developer Intern',
  'React.js Developer Intern',
  'Node.js Developer Intern',
  'Python Developer Intern',
  'Machine Learning Engineer Intern',
  'Data Science Intern',
  'Data Analyst Intern',
  'DevOps Engineer Intern',
  'Cloud Engineer Intern',
  'Mobile App Developer Intern',
  'iOS Developer Intern',
  'Android Developer Intern',
  'Flutter Developer Intern',
  'React Native Developer Intern',
  'UI/UX Designer Intern',
  'Product Designer Intern',
  'Graphic Designer Intern',
  'QA Engineer Intern',
  'Software Tester Intern',
  'Cybersecurity Analyst Intern',
  'Network Engineer Intern',
  'Database Administrator Intern',
  'Business Analyst Intern',
  'Project Manager Intern',
  'Scrum Master Intern',
  'Technical Writer Intern',
  'Content Writer Intern',
  'SEO Specialist Intern',
  'Digital Marketing Intern',
  'Social Media Manager Intern',
  'AI/ML Research Intern',
  'Blockchain Developer Intern',
  'Game Developer Intern',
  'Unity Developer Intern',
  'Embedded Systems Intern',
  'IoT Developer Intern',
  'Robotics Engineer Intern',
  'Computer Vision Intern',
  'NLP Engineer Intern',
  'Big Data Engineer Intern',
  'ETL Developer Intern',
  'Salesforce Developer Intern',
  'SAP Consultant Intern',
  'ERP Developer Intern',
  'SharePoint Developer Intern',
  'WordPress Developer Intern',
  'PHP Developer Intern',
  'Java Developer Intern',
  '.NET Developer Intern',
  'C++ Developer Intern',
  'Rust Developer Intern',
  'Go Developer Intern',
  'Ruby on Rails Intern'
];

const companies = [
  { name: 'TechCorp Solutions', industry: 'Software Development' },
  { name: 'DataMind Analytics', industry: 'Data Science' },
  { name: 'CloudFirst Technologies', industry: 'Cloud Computing' },
  { name: 'InnovateTech Labs', industry: 'Research & Development' },
  { name: 'DigitalEdge Systems', industry: 'Digital Transformation' },
  { name: 'CyberShield Security', industry: 'Cybersecurity' },
  { name: 'MobileFirst Apps', industry: 'Mobile Development' },
  { name: 'AI Nexus Corporation', industry: 'Artificial Intelligence' },
  { name: 'WebSphere Developers', industry: 'Web Development' },
  { name: 'FinTech Innovations', industry: 'Financial Technology' },
  { name: 'HealthTech Solutions', industry: 'Healthcare Technology' },
  { name: 'EduTech Global', industry: 'Education Technology' },
  { name: 'GameStudio Pro', industry: 'Game Development' },
  { name: 'BlockChain Labs', industry: 'Blockchain Technology' },
  { name: 'IoT Solutions Hub', industry: 'Internet of Things' }
];

const locations = [
  'Islamabad, Pakistan',
  'Lahore, Pakistan',
  'Karachi, Pakistan',
  'Rawalpindi, Pakistan',
  'Peshawar, Pakistan',
  'Faisalabad, Pakistan',
  'Multan, Pakistan',
  'Remote - Pakistan',
  'Islamabad (Remote Option)',
  'Lahore (Hybrid)',
  'Karachi (On-site)',
  'Remote - Worldwide'
];

const workTypes = ['On-site', 'Remote', 'Hybrid'];

const durations = [
  '2 Months',
  '3 Months',
  '4 Months',
  '6 Months',
  '8 Weeks',
  '10 Weeks',
  '12 Weeks',
  '16 Weeks'
];

const salaries = [
  '15,000/month',
  '20,000/month',
  '25,000/month',
  '30,000/month',
  '35,000/month',
  '40,000/month',
  '45,000/month',
  '50,000/month',
  '60,000/month',
  '75,000/month',
  'Unpaid',
  'Stipend Based',
  'Performance Based'
];

const technologyStacks = [
  ['React.js', 'Node.js', 'MongoDB', 'Express.js', 'JavaScript', 'TypeScript'],
  ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker'],
  ['Java', 'Spring Boot', 'MySQL', 'Hibernate', 'Maven'],
  ['Vue.js', 'Nuxt.js', 'GraphQL', 'Apollo', 'Tailwind CSS'],
  ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Material UI'],
  ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'SQLite'],
  ['React Native', 'JavaScript', 'Redux', 'Expo', 'Firebase'],
  ['Python', 'TensorFlow', 'Keras', 'Pandas', 'NumPy', 'Scikit-learn'],
  ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD'],
  ['Azure', 'DevOps', 'PowerShell', '.NET Core', 'SQL Server'],
  ['PHP', 'Laravel', 'MySQL', 'Redis', 'Composer'],
  ['Ruby', 'Rails', 'PostgreSQL', 'Sidekiq', 'RSpec'],
  ['Go', 'Gin', 'gRPC', 'PostgreSQL', 'Docker'],
  ['Swift', 'iOS', 'SwiftUI', 'Core Data', 'Xcode'],
  ['Kotlin', 'Android', 'Jetpack Compose', 'Room', 'Retrofit'],
  ['C#', '.NET', 'Entity Framework', 'Azure', 'SQL Server'],
  ['Solidity', 'Web3.js', 'Ethereum', 'Hardhat', 'React.js'],
  ['Unity', 'C#', 'Blender', '3D Modeling', 'Game Physics'],
  ['R', 'Python', 'Tableau', 'Power BI', 'SQL', 'Statistics'],
  ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research']
];

const requirementsSets = [
  [
    'Currently pursuing BS/MS in Computer Science or related field',
    'Strong understanding of data structures and algorithms',
    'Proficient in at least one programming language',
    'Good communication and teamwork skills',
    'Ability to learn quickly and adapt to new technologies',
    'Basic understanding of version control (Git)'
  ],
  [
    'Enrolled in final year of BS Computer Science or Software Engineering',
    'Hands-on experience with web development technologies',
    'Knowledge of RESTful APIs and database design',
    'Problem-solving mindset and attention to detail',
    'Excellent written and verbal communication skills'
  ],
  [
    'CGPA of 3.0 or above',
    'Strong analytical and logical thinking abilities',
    'Experience with agile development methodologies',
    'Passion for technology and continuous learning',
    'Portfolio of personal or academic projects'
  ],
  [
    'Currently enrolled in a recognized university',
    'Minimum 6 months availability for internship',
    'Knowledge of software development lifecycle',
    'Team player with positive attitude',
    'Willingness to work in a fast-paced environment'
  ],
  [
    'Background in Computer Science, IT, or related discipline',
    'Familiarity with cloud platforms (AWS/Azure/GCP)',
    'Understanding of software architecture patterns',
    'Self-motivated with ability to work independently',
    'Interest in emerging technologies and trends'
  ]
];

const jobDescriptions = [
  `We are looking for a talented and motivated intern to join our dynamic development team. As an intern, you will work on real-world projects, collaborate with experienced professionals, and gain hands-on experience in cutting-edge technologies.

Key Responsibilities:
• Develop and maintain web applications using modern frameworks
• Collaborate with cross-functional teams to define and implement new features
• Write clean, maintainable, and well-documented code
• Participate in code reviews and contribute to team knowledge sharing
• Debug and troubleshoot application issues
• Learn and apply best practices in software development

What We Offer:
• Mentorship from senior developers
• Exposure to full software development lifecycle
• Flexible working hours
• Certificate of completion
• Potential for full-time employment based on performance`,

  `Join our innovative team and be part of building next-generation solutions! This internship offers an excellent opportunity to work with industry experts and develop practical skills that will accelerate your career.

What You'll Do:
• Design and implement scalable software solutions
• Work with modern development tools and frameworks
• Participate in agile ceremonies including daily standups and sprint planning
• Contribute to technical documentation
• Test and deploy applications to production environments
• Collaborate with designers and product managers

Benefits:
• Competitive stipend
• Remote work flexibility
• Professional development opportunities
• Networking with industry professionals
• Letter of recommendation upon successful completion`,

  `We're seeking enthusiastic interns who are passionate about technology and eager to learn. This position provides a unique opportunity to work on impactful projects while developing your technical and professional skills.

Your Role:
• Build and optimize application features
• Analyze requirements and propose technical solutions
• Work closely with QA team for testing and quality assurance
• Document code and technical specifications
• Attend training sessions and workshops
• Present project updates to stakeholders

Perks:
• Hands-on experience with enterprise-level projects
• One-on-one mentoring sessions
• Access to online learning platforms
• Team building activities
• Performance-based bonus opportunities`,

  `Exciting internship opportunity for aspiring developers! Work alongside talented engineers, learn industry best practices, and contribute to products used by thousands of users.

Responsibilities:
• Assist in designing and developing software modules
• Perform unit testing and bug fixing
• Participate in brainstorming and solution design sessions
• Learn version control and CI/CD practices
• Support senior developers in complex implementations
• Create and maintain technical documentation

What's In It For You:
• Real project experience to add to your portfolio
• Industry-recognized certification
• Flexible hybrid working model
• Weekly learning sessions
• Career guidance and interview preparation`,

  `Be part of our growth story! We're looking for creative problem-solvers to join our internship program. This is your chance to make a real impact while building skills for a successful tech career.

What You'll Work On:
• Develop features for our core platform
• Integrate third-party APIs and services
• Optimize application performance
• Collaborate with UX/UI designers
• Participate in sprint retrospectives
• Contribute ideas for product improvements

Why Join Us:
• Startup culture with big company resources
• Direct interaction with leadership team
• Opportunity to shape product direction
• Modern office with recreational facilities
• Monthly team outings and events`
];

const tags = [
  ['Technology', 'Software', 'Development'],
  ['Web Development', 'Frontend', 'JavaScript'],
  ['Backend', 'APIs', 'Databases'],
  ['Mobile', 'iOS', 'Android'],
  ['Data Science', 'Analytics', 'Machine Learning'],
  ['Cloud', 'DevOps', 'Infrastructure'],
  ['Design', 'UI/UX', 'Creative'],
  ['AI', 'Automation', 'Innovation'],
  ['Security', 'Networking', 'IT'],
  ['Finance', 'Banking', 'FinTech']
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateFutureDate(daysAhead, variance = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead + Math.floor(Math.random() * variance));
  return date;
}

async function seedJobsComplete() {
  try {
    console.log('🌱 Starting Complete Jobs seeding process...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected for seeding');

    // Get existing company users
    let companyUsers = await User.find({ role: 'company' }).limit(15);
    console.log(`🏢 Found ${companyUsers.length} company users`);

    // If no company users, create some
    if (companyUsers.length === 0) {
      console.log('⚠️ No company users found. Creating sample company users...');
      
      for (let i = 0; i < 10; i++) {
        const company = companies[i % companies.length];
        const companyUser = new User({
          name: company.name,
          email: `company${i + 1}@example.com`,
          password: '$2a$10$xVWsX5LPZ8Q8Q8Q8Q8Q8Q.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8', // hashed password
          role: 'company',
          isVerified: true
        });
        
        try {
          await companyUser.save();
          companyUsers.push(companyUser);
          console.log(`   ✅ Created company user: ${company.name}`);
        } catch (e) {
          console.log(`   ⚠️ Company user may already exist: ${company.name}`);
        }
      }
    }

    // Clear existing jobs (optional - comment out if you want to keep existing)
    // await Job.deleteMany({});
    // console.log('🗑️ Cleared existing jobs');

    // Seed 55 jobs
    console.log('\n💼 Seeding Jobs...');
    let jobCount = 0;

    for (let i = 0; i < 55; i++) {
      const companyUser = companyUsers[i % companyUsers.length];
      const company = companies[i % companies.length];
      const jobTitle = jobTitles[i % jobTitles.length];
      
      // Add unique suffix to job title to avoid duplicates
      const uniqueJobTitle = `${jobTitle} - ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`;

      // Generate dates
      const startDate = generateFutureDate(7, 14); // Start 1-3 weeks from now
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (2 + Math.floor(Math.random() * 4))); // 2-5 months duration
      
      const applicationDeadline = new Date(startDate);
      applicationDeadline.setDate(applicationDeadline.getDate() - 3); // Deadline 3 days before start

      const job = new Job({
        jobTitle: uniqueJobTitle,
        location: getRandomElement(locations),
        workType: getRandomElement(workTypes),
        duration: getRandomElement(durations),
        salary: getRandomElement(salaries),
        startDate: startDate,
        endDate: endDate,
        applicationDeadline: applicationDeadline,
        jobDescription: getRandomElement(jobDescriptions),
        requirements: getRandomElement(requirementsSets),
        technologyStack: getRandomElement(technologyStacks),
        companyId: companyUser._id,
        companyName: company.name,
        status: i % 10 === 0 ? 'Draft' : 'Active', // Most are active, some drafts
        applicationsCount: Math.floor(Math.random() * 25),
        applicationLimit: 30 + Math.floor(Math.random() * 30), // 30-60 limit
        viewsCount: Math.floor(Math.random() * 500),
        isUrgent: Math.random() > 0.8, // 20% are urgent
        tags: getRandomElement(tags)
      });

      await job.save();
      jobCount++;
      console.log(`   ✅ Created Job #${jobCount}: ${uniqueJobTitle} at ${company.name} [${job.status}]`);
    }

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n📊 Seeding Summary:');
    console.log('═══════════════════════════════════════');
    
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'Active' });
    const urgentJobs = await Job.countDocuments({ isUrgent: true });
    const remoteJobs = await Job.countDocuments({ workType: 'Remote' });
    const hybridJobs = await Job.countDocuments({ workType: 'Hybrid' });
    const onsiteJobs = await Job.countDocuments({ workType: 'On-site' });
    
    console.log(`   Total Jobs: ${totalJobs}`);
    console.log(`   Active Jobs: ${activeJobs}`);
    console.log(`   Urgent Jobs: ${urgentJobs}`);
    console.log(`   Remote Jobs: ${remoteJobs}`);
    console.log(`   Hybrid Jobs: ${hybridJobs}`);
    console.log(`   On-site Jobs: ${onsiteJobs}`);
    console.log('═══════════════════════════════════════');
    
    // Sample of created jobs
    const sampleJobs = await Job.find({ status: 'Active' }).limit(5).select('jobTitle companyName location workType salary duration technologyStack');
    console.log('\n📋 Sample of Created Jobs:');
    sampleJobs.forEach((job, idx) => {
      console.log(`   ${idx + 1}. ${job.jobTitle} at ${job.companyName}`);
      console.log(`      📍 ${job.location} | 💼 ${job.workType} | 💰 ${job.salary} | ⏱️ ${job.duration}`);
      console.log(`      🛠️ Tech: ${job.technologyStack.slice(0, 4).join(', ')}`);
    });
    
    console.log('\n🎉 Jobs seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding
seedJobsComplete();
