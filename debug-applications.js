const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function debugApplications() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        // Find Company_1
        const company = await User.findOne({ username: 'Company_1', role: 'company' });
        console.log('\n📊 Company_1 Data:', {
            id: company._id,
            username: company.username,
            companyName: company.companyName
        });

        // Find all applications for Company_1
        const allApplications = await Application.find({ companyId: company._id });
        console.log('\n📋 ALL Applications for Company_1:');
        allApplications.forEach((app, index) => {
            console.log(`${index + 1}. Student: ${app.studentName}, Status: ${app.status}, Job: ${app.jobTitle}`);
            console.log(`   Roll: ${app.studentProfile?.rollNumber}, Email: ${app.studentEmail}`);
            console.log(`   Department: ${app.studentProfile?.department}, CGPA: ${app.studentProfile?.cgpa}`);
            console.log(`   Applied: ${app.appliedDate}, Hired: ${app.hiredDate}`);
            console.log(`   Interview: ${app.interviewDateTime}`);
        });

        // Check accepted applications specifically
        const acceptedApplications = await Application.find({ 
            companyId: company._id, 
            status: 'hired' 
        });
        console.log(`\n✅ ACCEPTED/HIRED Applications: ${acceptedApplications.length}`);
        acceptedApplications.forEach((app, index) => {
            console.log(`${index + 1}. ${app.studentName} - ${app.status}`);
        });

        // Check pending applications
        const pendingApplications = await Application.find({ 
            companyId: company._id, 
            status: 'pending' 
        });
        console.log(`\n⏳ PENDING Applications: ${pendingApplications.length}`);
        pendingApplications.forEach((app, index) => {
            console.log(`${index + 1}. ${app.studentName} - ${app.status}`);
        });

        // Check if there are any status issues
        const statusCounts = await Application.aggregate([
            { $match: { companyId: company._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('\n📊 Status Distribution:');
        statusCounts.forEach(status => {
            console.log(`   ${status._id}: ${status.count}`);
        });

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

debugApplications();
