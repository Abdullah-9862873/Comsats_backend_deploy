const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function checkAllCompanies() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        // Find all companies
        const companies = await User.find({ role: 'company' });
        console.log(`\n📊 Found ${companies.length} companies:`);
        
        for (const company of companies) {
            console.log(`\n🏢 Company: ${company.username} (${company.companyName || 'No name'})`);
            console.log(`   ID: ${company._id}`);
            
            // Check applications for this company
            const allApps = await Application.find({ companyId: company._id });
            const acceptedApps = await Application.find({ 
                companyId: company._id, 
                overallStatus: 'approved' 
            });
            
            console.log(`   Total Applications: ${allApps.length}`);
            console.log(`   Accepted Applications: ${acceptedApps.length}`);
            
            if (allApps.length > 0) {
                console.log('   Application Statuses:');
                const statusCounts = {};
                allApps.forEach(app => {
                    const status = app.overallStatus || 'null';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                
                Object.entries(statusCounts).forEach(([status, count]) => {
                    console.log(`     ${status}: ${count}`);
                });
            }
        }

        // Check students
        console.log('\n👥 Students:');
        const students = await User.find({ role: 'student' });
        console.log(`   Found ${students.length} students`);

        // Check jobs
        console.log('\n💼 Jobs:');
        const jobs = await Job.find();
        console.log(`   Found ${jobs.length} jobs`);
        jobs.forEach(job => {
            console.log(`   - ${job.title} by ${job.companyName} (ID: ${job.companyId})`);
        });

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

checkAllCompanies();
