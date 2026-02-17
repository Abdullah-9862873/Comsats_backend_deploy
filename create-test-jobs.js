const mongoose = require('mongoose');
const Job = require('./models/Job');

// Create test jobs
async function createTestJobs() {
  try {
    await mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Sample test jobs
    const testJobs = [
      {
        jobTitle: 'Software Development Intern',
        location: 'Islamabad',
        workType: 'Hybrid',
        duration: '3 months',
        salary: '25,000 - 35,000 PKR',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-04-15'),
        applicationDeadline: new Date('2025-01-10'),
        jobDescription: 'Exciting opportunity for software development intern to work with modern technologies.',
        requirements: ['Knowledge of JavaScript', 'Basic understanding of React', 'Problem-solving skills'],
        technologyStack: ['JavaScript', 'React', 'Node.js'],
        companyId: '68de1dd28b0d207fd02e494b', // TechCorp Solutions
        companyName: 'TechCorp Solutions',
        status: 'Active'
      },
      {
        jobTitle: 'Data Science Intern',
        location: 'Lahore',
        workType: 'Remote',
        duration: '4 months',
        salary: '30,000 - 40,000 PKR',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-06-01'),
        applicationDeadline: new Date('2025-01-25'),
        jobDescription: 'Work with data analytics and machine learning projects.',
        requirements: ['Python programming', 'Basic statistics knowledge', 'Data analysis skills'],
        technologyStack: ['Python', 'Pandas', 'Scikit-learn'],
        companyId: '68de1dd38b0d207fd02e4955', // Green Energy Solutions
        companyName: 'Green Energy Solutions',
        status: 'Active'
      },
      {
        jobTitle: 'Marketing Intern',
        location: 'Karachi',
        workType: 'On-site',
        duration: '3 months',
        salary: '20,000 - 30,000 PKR',
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-04-20'),
        applicationDeadline: new Date('2025-01-15'),
        jobDescription: 'Support marketing campaigns and digital marketing initiatives.',
        requirements: ['Marketing fundamentals', 'Social media knowledge', 'Communication skills'],
        technologyStack: ['Social Media Tools', 'Google Analytics', 'Canva'],
        companyId: '68de1dd38b0d207fd02e495b', // Healthcare Innovations
        companyName: 'Healthcare Innovations Ltd',
        status: 'Inactive'
      },
      {
        jobTitle: 'Finance Intern',
        location: 'Islamabad',
        workType: 'Hybrid',
        duration: '6 months',
        salary: '28,000 - 38,000 PKR',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-01'),
        applicationDeadline: new Date('2025-02-15'),
        jobDescription: 'Assist with financial analysis and reporting.',
        requirements: ['Finance background', 'Excel proficiency', 'Analytical thinking'],
        technologyStack: ['Excel', 'Financial Software', 'SQL'],
        companyId: '68de1dd48b0d207fd02e4961', // FinTech Solutions
        companyName: 'FinTech Solutions',
        status: 'Draft'
      }
    ];
    
    // Insert test jobs
    const result = await Job.insertMany(testJobs);
    console.log(`Created ${result.length} test jobs`);
    
    // Check current job counts
    const jobCounts = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Current job distribution:', jobCounts);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestJobs();