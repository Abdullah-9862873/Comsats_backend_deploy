// Check approved applications and student data
const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');
        
        // Import all models
        const User = require('./models/User');
        const Application = require('./models/Application');
        const Job = require('./models/Job');
        
        // Check approved applications
        console.log('=== CHECKING APPROVED APPLICATIONS ===');
        const approvedApps = await Application.find({ overallStatus: 'approved' });
        console.log(`Found ${approvedApps.length} approved applications:`);
        
        for (const app of approvedApps) {
            console.log('\n--- Application ---');
            console.log('ID:', app._id);
            console.log('Student ID:', app.studentId);
            console.log('Student Name:', app.studentName);
            console.log('Student Email:', app.studentEmail);
            console.log('Job ID:', app.jobId);
            console.log('Job Title:', app.jobTitle);
            console.log('Company ID:', app.companyId);
            console.log('Company Name:', app.companyName);
            console.log('Supervisor ID:', app.supervisorId);
            console.log('Supervisor Name:', app.supervisorName);
            console.log('Overall Status:', app.overallStatus);
            console.log('Applied At:', app.appliedAt);
        }
        
        // Check what companies exist
        console.log('\n=== CHECKING COMPANIES ===');
        const companies = await User.find({ role: 'company' }).select('name email');
        companies.forEach(company => {
            console.log(`- ${company.name} (${company.email})`);
        });
        
        await mongoose.disconnect();
        console.log('\nDatabase connection closed.');
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
