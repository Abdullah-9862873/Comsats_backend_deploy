const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function checkUserData() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        console.log('\n👥 STUDENTS:');
        const students = await User.find({ role: 'student' });
        students.forEach((student, index) => {
            console.log(`${index + 1}. ID: ${student._id}`);
            console.log(`   Username: ${student.username}`);
            console.log(`   Email: ${student.email}`);
            console.log(`   Name: ${student.name}`);
        });

        console.log('\n👤 SUPERVISORS:');
        const supervisors = await User.find({ role: 'supervisor' });
        supervisors.forEach((supervisor, index) => {
            console.log(`${index + 1}. ID: ${supervisor._id}`);
            console.log(`   Username: ${supervisor.username}`);
            console.log(`   Email: ${supervisor.email}`);
            console.log(`   Name: ${supervisor.name}`);
        });

        console.log('\n🏢 COMPANIES:');
        const companies = await User.find({ role: 'company' });
        companies.forEach((company, index) => {
            console.log(`${index + 1}. ID: ${company._id}`);
            console.log(`   Username: ${company.username}`);
            console.log(`   Email: ${company.email}`);
            console.log(`   Company Name: ${company.companyName}`);
            console.log(`   Name: ${company.name}`);
        });

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

checkUserData();
