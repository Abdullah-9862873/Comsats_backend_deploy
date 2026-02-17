const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');

const jobs = [
  {
    jobTitle: "Full Stack Developer",
    location: "Islamabad",
    workType: "On-site",
    duration: "3 Months",
    salary: "25000",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000),
    jobDescription: "Join our dynamic team as a Full Stack Developer Intern and gain hands-on experience with modern web technologies.",
    requirements: ["BS Degree in Computer Science", "JavaScript knowledge"],
    technologyStack: ["React", "Node.js"],
    companyName: "TechCorp Solutions",
    status: "Active",
    applicationsCount: 0,
    applicationLimit: 50,
    viewsCount: 0,
    isUrgent: false,
    tags: ["Frontend", "Backend"],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Mobile App Developer",
    location: "Lahore",
    workType: "Remote",
    duration: "4 Months",
    salary: "30000",
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 130 * 24 * 60 * 60 * 1000),
    jobDescription: "Exciting opportunity to work on cutting-edge mobile applications using React Native and Flutter.",
    requirements: ["Mobile development experience", "UI/UX knowledge"],
    technologyStack: ["React Native", "Flutter"],
    companyName: "TechCorp Solutions",
    status: "Active",
    applicationsCount: 0,
    applicationLimit: 30,
    viewsCount: 0,
    isUrgent: true,
    tags: ["Mobile", "Frontend"],
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Data Scientist",
    location: "Karachi",
    workType: "Hybrid",
    duration: "6 Months",
    salary: "35000",
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000),
    jobDescription: "Work with large datasets, build predictive models, and generate insights that drive business decisions.",
    requirements: ["Statistics background", "Python proficiency"],
    technologyStack: ["Python", "TensorFlow"],
    companyName: "TechCorp Solutions",
    status: "Closed",
    applicationsCount: 15,
    applicationLimit: 25,
    viewsCount: 45,
    isUrgent: false,
    tags: ["Data Science", "AI"],
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Backend Developer",
    location: "Islamabad",
    workType: "On-site",
    duration: "3 Months",
    salary: "28000",
    startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 102 * 24 * 60 * 60 * 1000),
    jobDescription: "Develop server-side applications and APIs using modern backend technologies.",
    requirements: ["BS Degree", "Node.js experience"],
    technologyStack: ["Node.js", "MongoDB"],
    companyName: "TechCorp Solutions",
    status: "Active",
    applicationsCount: 3,
    applicationLimit: 40,
    viewsCount: 12,
    isUrgent: false,
    tags: ["Backend", "API"],
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Frontend Developer",
    location: "Lahore",
    workType: "Remote",
    duration: "4 Months",
    salary: "26000",
    startDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 128 * 24 * 60 * 60 * 1000),
    jobDescription: "Create responsive and interactive user interfaces using modern frontend frameworks.",
    requirements: ["HTML/CSS/JS", "React knowledge"],
    technologyStack: ["React", "CSS"],
    companyName: "Digital Innovations Ltd",
    status: "Active",
    applicationsCount: 7,
    applicationLimit: 35,
    viewsCount: 23,
    isUrgent: true,
    tags: ["Frontend", "UI"],
    applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "UI/UX Designer",
    location: "Karachi",
    workType: "Hybrid",
    duration: "3 Months",
    salary: "22000",
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000),
    jobDescription: "Design beautiful and intuitive user interfaces for web and mobile applications.",
    requirements: ["Design portfolio", "Figma experience"],
    technologyStack: ["Figma", "Adobe XD"],
    companyName: "CodeCraft Studios",
    status: "Active",
    applicationsCount: 2,
    applicationLimit: 20,
    viewsCount: 8,
    isUrgent: false,
    tags: ["Design", "UI/UX"],
    applicationDeadline: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "DevOps Engineer",
    location: "Islamabad",
    workType: "On-site",
    duration: "5 Months",
    salary: "32000",
    startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 170 * 24 * 60 * 60 * 1000),
    jobDescription: "Manage cloud infrastructure and implement CI/CD pipelines for scalable applications.",
    requirements: ["Linux knowledge", "Docker experience"],
    technologyStack: ["Docker", "AWS"],
    companyName: "TechCorp Solutions",
    status: "Active",
    applicationsCount: 1,
    applicationLimit: 15,
    viewsCount: 5,
    isUrgent: true,
    tags: ["DevOps", "Cloud"],
    applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "QA Engineer",
    location: "Lahore",
    workType: "Remote",
    duration: "3 Months",
    salary: "24000",
    startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 96 * 24 * 60 * 60 * 1000),
    jobDescription: "Ensure software quality through comprehensive testing and automation.",
    requirements: ["Testing knowledge", "Attention to detail"],
    technologyStack: ["Selenium", "Jest"],
    companyName: "Digital Innovations Ltd",
    status: "Active",
    applicationsCount: 4,
    applicationLimit: 25,
    viewsCount: 15,
    isUrgent: false,
    tags: ["QA", "Testing"],
    applicationDeadline: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Machine Learning Engineer",
    location: "Karachi",
    workType: "Hybrid",
    duration: "6 Months",
    salary: "40000",
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 194 * 24 * 60 * 60 * 1000),
    jobDescription: "Develop and deploy machine learning models for real-world applications.",
    requirements: ["ML background", "Python expertise"],
    technologyStack: ["Python", "PyTorch"],
    companyName: "DataFlow Analytics",
    status: "Active",
    applicationsCount: 8,
    applicationLimit: 12,
    viewsCount: 32,
    isUrgent: true,
    tags: ["ML", "AI"],
    applicationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Cybersecurity Analyst",
    location: "Islamabad",
    workType: "On-site",
    duration: "4 Months",
    salary: "35000",
    startDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 138 * 24 * 60 * 60 * 1000),
    jobDescription: "Protect digital assets and analyze security threats in enterprise environments.",
    requirements: ["Security knowledge", "Network understanding"],
    technologyStack: ["Kali Linux", "Wireshark"],
    companyName: "TechCorp Solutions",
    status: "Active",
    applicationsCount: 2,
    applicationLimit: 18,
    viewsCount: 9,
    isUrgent: false,
    tags: ["Security", "Network"],
    applicationDeadline: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Game Developer",
    location: "Lahore",
    workType: "On-site",
    duration: "5 Months",
    salary: "29000",
    startDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 161 * 24 * 60 * 60 * 1000),
    jobDescription: "Create engaging games using Unity and modern game development tools.",
    requirements: ["Game development interest", "C# knowledge"],
    technologyStack: ["Unity", "C#"],
    companyName: "CodeCraft Studios",
    status: "Active",
    applicationsCount: 6,
    applicationLimit: 22,
    viewsCount: 18,
    isUrgent: false,
    tags: ["Gaming", "Unity"],
    applicationDeadline: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Blockchain Developer",
    location: "Karachi",
    workType: "Remote",
    duration: "4 Months",
    salary: "45000",
    startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 129 * 24 * 60 * 60 * 1000),
    jobDescription: "Build decentralized applications and smart contracts on blockchain platforms.",
    requirements: ["Blockchain knowledge", "Solidity experience"],
    technologyStack: ["Solidity", "Web3.js"],
    companyName: "Digital Innovations Ltd",
    status: "Active",
    applicationsCount: 5,
    applicationLimit: 10,
    viewsCount: 25,
    isUrgent: true,
    tags: ["Blockchain", "Web3"],
    applicationDeadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Cloud Architect",
    location: "Islamabad",
    workType: "Hybrid",
    duration: "6 Months",
    salary: "38000",
    startDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 196 * 24 * 60 * 60 * 1000),
    jobDescription: "Design and implement scalable cloud solutions using AWS and Azure.",
    requirements: ["Cloud certification", "Architecture experience"],
    technologyStack: ["AWS", "Azure"],
    companyName: "TechCorp Solutions",
    status: "Active",
    applicationsCount: 3,
    applicationLimit: 8,
    viewsCount: 14,
    isUrgent: false,
    tags: ["Cloud", "Architecture"],
    applicationDeadline: new Date(Date.now() + 36 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Product Manager",
    location: "Lahore",
    workType: "On-site",
    duration: "4 Months",
    salary: "33000",
    startDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 133 * 24 * 60 * 60 * 1000),
    jobDescription: "Lead product development and coordinate with cross-functional teams.",
    requirements: ["Product management experience", "Communication skills"],
    technologyStack: ["Jira", "Figma"],
    companyName: "CodeCraft Studios",
    status: "Active",
    applicationsCount: 9,
    applicationLimit: 15,
    viewsCount: 28,
    isUrgent: true,
    tags: ["Product", "Management"],
    applicationDeadline: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000)
  },
  {
    jobTitle: "Digital Marketing Specialist",
    location: "Karachi",
    workType: "Remote",
    duration: "3 Months",
    salary: "21000",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000),
    jobDescription: "Create and manage digital marketing campaigns across multiple platforms.",
    requirements: ["Marketing knowledge", "Social media experience"],
    technologyStack: ["Google Analytics", "Facebook Ads"],
    companyName: "Digital Innovations Ltd",
    status: "Active",
    applicationsCount: 12,
    applicationLimit: 30,
    viewsCount: 35,
    isUrgent: false,
    tags: ["Marketing", "Digital"],
    applicationDeadline: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000)
  }
];

async function seedJobs() {
  try {
    console.log('🌱 Starting job seeding process...');
    
    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];
      
      // Find company user by company name
      const companyUser = await User.findOne({ 
        name: jobData.companyName,
        role: 'company' 
      });
      
      if (!companyUser) {
        console.log(`⚠️  Company user not found for ${jobData.companyName}, skipping job...`);
        continue;
      }
      
      // Check if job already exists
      const existingJob = await Job.findOne({ 
        jobTitle: jobData.jobTitle,
        companyName: jobData.companyName 
      });
      
      if (existingJob) {
        console.log(`⚠️  Job already exists: ${jobData.jobTitle} at ${jobData.companyName}, skipping...`);
        continue;
      }
      
      // Create job
      const job = new Job({
        ...jobData,
        companyId: companyUser._id
      });
      
      await job.save();
      console.log(`✅ Created job: ${jobData.jobTitle} at ${jobData.companyName}`);
    }
    
    console.log('🎉 Job seeding completed successfully!');
    const totalCreated = jobs.length;
    console.log(`📊 Total jobs processed: ${totalCreated}`);
    
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
  }
}

module.exports = { seedJobs, jobs };