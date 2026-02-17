const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
require('dotenv').config();

// Test function to create a job directly in MongoDB
async function testJobCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    console.log('Database Name:', mongoose.connection.name);

    // First, let's create a test company user if it doesn't exist
    let testCompany = await User.findOne({ email: 'testcompany@example.com' });
    
    if (!testCompany) {
      console.log('Creating test company user...');
      testCompany = new User({
        name: 'Test Company',
        email: 'testcompany@example.com',
        password: 'testpassword123', // In real app, this should be hashed
        role: 'company',
        company: {
          companyName: 'Test Tech Solutions',
          industry: 'Technology',
          about: 'A test company for development purposes'
        }
      });
      
      await testCompany.save();
      console.log('Test company created:', testCompany._id);
    } else {
      console.log('Test company found:', testCompany._id);
    }

    // Now create a test job
    console.log('Creating test job...');
    const testJobData = {
      jobTitle: 'Full Stack Developer Intern',
      location: 'Lahore, Pakistan',
      workType: 'Hybrid',
      duration: '3 months',
      salary: 'Rs. 25,000/month',
      startDate: new Date('2025-08-15'),
      endDate: new Date('2025-11-15'),
      jobDescription: 'We are looking for a passionate Full Stack Developer intern to join our team and work on exciting projects.',
      requirements: [
        'Currently pursuing CS/IT degree',
        'Basic knowledge of JavaScript',
        'Familiarity with React.js',
        'Good communication skills'
      ],
      technologyStack: [
        'React.js',
        'Node.js',
        'MongoDB',
        'Express.js'
      ],
      companyId: testCompany._id,
      companyName: testCompany.name,
      isUrgent: false,
      tags: ['internship', 'full-stack', 'remote-friendly']
    };

    console.log('Test job data:', JSON.stringify(testJobData, null, 2));

    const testJob = new Job(testJobData);
    const savedJob = await testJob.save();
    
    console.log('✅ Test job created successfully!');
    console.log('Job ID:', savedJob._id);
    console.log('Job Title:', savedJob.jobTitle);

    // Verify the job was saved
    const foundJob = await Job.findById(savedJob._id);
    console.log('✅ Job verified in database:', foundJob ? 'Found' : 'Not Found');

    // Get total job count
    const jobCount = await Job.countDocuments();
    console.log('Total jobs in database:', jobCount);

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('❌ Error in test:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
console.log('Starting job creation test...');
testJobCreation();
