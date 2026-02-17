// Check for existing data to test the internee evaluation system
const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');
        
        // Import models
        const User = require('./models/User');
        const Application = require('./models/Application');
        const Job = require('./models/Job');
        
        // Check for companies
        console.log('=== CHECKING COMPANIES ===');
        const companies = await User.find({ role: 'company' }).select('name email company');
        console.log(`Found ${companies.length} companies:`);
        companies.forEach(company => {
            console.log(`- ${company.name} (${company.email}) - Company: ${company.company}`);
        });
        
        // Check for accepted applications  
        console.log('\n=== CHECKING ACCEPTED APPLICATIONS ===');
        const acceptedApps = await Application.find({ overallStatus: 'approved' })
            .populate('student', 'name email rollNumber')
            .populate('job', 'title designation company')
            .populate('company', 'name email');
            
        console.log(`Found ${acceptedApps.length} accepted applications:`);
        acceptedApps.forEach(app => {
            console.log(`- Student: ${app.student.name} (${app.student.rollNumber})`);
            console.log(`  Job: ${app.job.title} at ${app.job.company}`);
            console.log(`  Applied: ${app.appliedAt.toDateString()}`);
            console.log('');
        });
        
        if (acceptedApps.length === 0) {
            console.log('No accepted applications found. You may need to:');
            console.log('1. Create test applications');
            console.log('2. Approve some applications through the company dashboard');
            console.log('3. Or run a script to create sample data');
        }
        
        await mongoose.disconnect();
        console.log('Database connection closed.');
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
