const mongoose = require('mongoose');
const Job = require('./models/Job');
const CompanyProfile = require('./models/CompanyProfile');

// Load environment variables
require('dotenv').config();

const sampleJobs = [
  {
    companyName: "TechCorp Solutions",
    jobs: [
      {
        jobTitle: "Full Stack Developer",
        jobDescription: "Join our dynamic team as a Full Stack Developer. Work on cutting-edge web applications using React, Node.js, and MongoDB. Perfect opportunity for fresh graduates to learn and grow.",
        workType: "On-site",
        location: "Karachi, Pakistan",
        salary: "PKR 60,000 - 80,000",
        duration: "6 months",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000), // ~6 months from now
        requirements: ["Bachelor's degree in Computer Science or related field", "0-2 years experience", "Strong problem-solving skills"],
        technologyStack: ["React", "Node.js", "JavaScript", "MongoDB", "Express.js"],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxApplications: 50
      },
      {
        jobTitle: "UI/UX Designer",
        jobDescription: "Creative UI/UX Designer needed to design user-friendly interfaces and improve user experience. Work with cross-functional teams to deliver amazing digital products.",
        workType: "Hybrid",
        location: "Karachi, Pakistan",
        salary: "PKR 50,000 - 70,000",
        duration: "4 months",
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000), // ~4 months from now
        requirements: ["Bachelor's degree in Design or related field", "Portfolio required", "Understanding of design principles"],
        technologyStack: ["Figma", "Adobe Creative Suite", "Prototyping", "User Research", "Wireframing"],
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        maxApplications: 30
      }
    ]
  },
  {
    companyName: "Green Energy Solutions",
    jobs: [
      {
        jobTitle: "Software Engineer - IoT",
        jobDescription: "Develop IoT solutions for renewable energy systems. Work on embedded systems, sensor networks, and data analytics platforms for solar and wind energy monitoring.",
        workType: "On-site",
        location: "Lahore, Pakistan",
        salary: "PKR 65,000 - 85,000",
        duration: "6 months",
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 192 * 24 * 60 * 60 * 1000),
        requirements: ["Engineering degree", "Experience with IoT platforms", "Knowledge of renewable energy systems"],
        technologyStack: ["Python", "IoT", "Embedded Systems", "Data Analytics", "Cloud Computing"],
        applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        maxApplications: 25
      }
    ]
  },
  {
    companyName: "Healthcare Innovations Ltd",
    jobs: [
      {
        jobTitle: "Healthcare Software Developer",
        jobDescription: "Develop healthcare management systems and medical device software. Contribute to improving patient care through innovative technology solutions.",
        workType: "On-site",
        location: "Islamabad, Pakistan",
        salary: "PKR 70,000 - 90,000",
        duration: "8 months",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 247 * 24 * 60 * 60 * 1000),
        requirements: ["Computer Science degree", "Understanding of healthcare industry", "Knowledge of medical standards"],
        technologyStack: ["Java", "Spring Boot", "Healthcare Systems", "Database Management", "Security"],
        applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        maxApplications: 40
      },
      {
        jobTitle: "Data Analyst - Healthcare",
        jobDescription: "Analyze healthcare data to derive insights for improving patient outcomes. Work with large datasets and create meaningful reports for healthcare professionals.",
        workType: "Hybrid",
        location: "Islamabad, Pakistan",
        salary: "PKR 55,000 - 75,000",
        duration: "5 months",
        startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
        requirements: ["Statistics or Data Science background", "Experience with healthcare data", "Strong analytical skills"],
        technologyStack: ["Python", "SQL", "Data Visualization", "Statistics", "Machine Learning"],
        applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        maxApplications: 20
      }
    ]
  },
  {
    companyName: "FinTech Solutions",
    jobs: [
      {
        jobTitle: "Mobile App Developer",
        jobDescription: "Develop mobile applications for digital banking and financial services. Create secure, user-friendly apps that revolutionize financial technology.",
        workType: "Hybrid",
        location: "Karachi, Pakistan",
        salary: "PKR 65,000 - 85,000",
        duration: "6 months",
        startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
        requirements: ["Mobile development experience", "Understanding of financial services", "Security-first mindset"],
        technologyStack: ["React Native", "Flutter", "Mobile Security", "API Integration", "Financial Systems"],
        applicationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        maxApplications: 35
      }
    ]
  },
  {
    companyName: "EduTech Learning",
    jobs: [
      {
        jobTitle: "Frontend Developer",
        jobDescription: "Build interactive learning platforms and educational tools. Create engaging user interfaces that enhance the online learning experience for students worldwide.",
        workType: "Remote",
        location: "Remote",
        salary: "PKR 50,000 - 70,000",
        duration: "5 months",
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 168 * 24 * 60 * 60 * 1000),
        requirements: ["Frontend development experience", "Interest in education technology", "Strong design sense"],
        technologyStack: ["React", "TypeScript", "CSS3", "Educational Technology", "Responsive Design"],
        applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        maxApplications: 30
      },
      {
        jobTitle: "Content Developer - Technical",
        jobDescription: "Create technical educational content and course materials. Develop programming courses, tutorials, and interactive learning experiences.",
        workType: "Remote",
        location: "Remote",
        salary: "PKR 30,000 - 45,000",
        duration: "3 months",
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000),
        requirements: ["Technical background", "Teaching or training experience", "Strong communication skills"],
        technologyStack: ["Technical Writing", "Programming", "Course Design", "Video Production", "Learning Management Systems"],
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        maxApplications: 15
      }
    ]
  }
];

async function createSampleJobs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal');
    console.log('Connected to MongoDB');

    let totalJobsCreated = 0;

    for (const companyData of sampleJobs) {
      // Find the company profile
      const companyProfile = await CompanyProfile.findOne({ companyName: companyData.companyName });
      
      if (!companyProfile) {
        console.log(`Company not found: ${companyData.companyName}`);
        continue;
      }

      console.log(`\nCreating jobs for: ${companyData.companyName}`);

      for (const jobData of companyData.jobs) {
        // Check if job already exists
        const existingJob = await Job.findOne({ 
          jobTitle: jobData.jobTitle,
          companyName: companyData.companyName
        });

        if (!existingJob) {
          const job = new Job({
            ...jobData,
            companyId: companyProfile.user,
            companyName: companyData.companyName,
            status: 'Active',
            postedAt: new Date()
          });

          try {
            await job.save();
            console.log(`  ✓ Created job: ${jobData.jobTitle}`);
            totalJobsCreated++;
          } catch (jobError) {
            console.error(`Error saving job: ${jobError}`);
            console.log('Validation errors:', jobError.errors);
          }
        } else {
          console.log(`  - Job already exists: ${jobData.jobTitle}`);
        }
      }
    }

    // Count total jobs
    const totalJobs = await Job.countDocuments();
    console.log(`\nTotal jobs in database: ${totalJobs}`);
    console.log(`New jobs created: ${totalJobsCreated}`);

    // Display summary by company
    console.log('\nJobs by Company:');
    for (const companyData of sampleJobs) {
      const jobCount = await Job.countDocuments({ companyName: companyData.companyName });
      console.log(`${companyData.companyName}: ${jobCount} jobs`);
    }

    console.log('\nSample jobs created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample jobs:', error);
    process.exit(1);
  }
}

createSampleJobs();
