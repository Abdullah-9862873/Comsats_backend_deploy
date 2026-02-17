const Job = require('./models/Job');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const createTestJobs = async () => {
  try {
    await connectDB();

    // Find a company user to assign jobs to
    const companyUser = await User.findOne({ role: 'company' });
    if (!companyUser) {
      console.log('No company user found. Please create a company user first.');
      process.exit(1);
    }

    console.log(`Found company: ${companyUser.name} (${companyUser.email})`);

    // Check if jobs already exist
    const existingJobs = await Job.find();
    if (existingJobs.length > 0) {
      console.log(`${existingJobs.length} jobs already exist. Skipping job creation.`);
      process.exit(0);
    }

    // Create test jobs
    const testJobs = [
      {
        title: 'Software Development Intern',
        company: companyUser._id,
        description: 'Join our development team to work on exciting web applications using React and Node.js.',
        requirements: [
          'Currently pursuing Computer Science or related degree',
          'Knowledge of JavaScript, React, and Node.js',
          'Good problem-solving skills',
          'Team player with good communication skills'
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        type: 'internship',
        location: 'Lahore, Pakistan',
        duration: '3 months',
        stipend: 25000,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      },
      {
        title: 'Frontend Developer Intern',
        company: companyUser._id,
        description: 'Work with our design team to create beautiful and responsive user interfaces.',
        requirements: [
          'Knowledge of HTML, CSS, and JavaScript',
          'Experience with React or Vue.js',
          'Understanding of responsive design',
          'Portfolio of previous work'
        ],
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS'],
        type: 'internship',
        location: 'Islamabad, Pakistan',
        duration: '2 months',
        stipend: 20000,
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        isActive: true
      },
      {
        title: 'Data Science Intern',
        company: companyUser._id,
        description: 'Analyze large datasets and build machine learning models to drive business insights.',
        requirements: [
          'Background in Statistics, Mathematics, or Computer Science',
          'Experience with Python and data analysis libraries',
          'Knowledge of machine learning concepts',
          'Strong analytical thinking'
        ],
        skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL'],
        type: 'internship',
        location: 'Karachi, Pakistan',
        duration: '4 months',
        stipend: 30000,
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        isActive: true
      }
    ];

    // Insert test jobs
    const createdJobs = await Job.insertMany(testJobs);
    console.log(`✅ Created ${createdJobs.length} test jobs successfully!`);
    
    createdJobs.forEach(job => {
      console.log(`- ${job.title} (${job.location}) - Stipend: Rs.${job.stipend}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating test jobs:', error);
    process.exit(1);
  }
};

createTestJobs();
