const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function fixApplicationStatuses() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        // Find Company_1
        const company = await User.findOne({ username: 'Company_1', role: 'company' });
        console.log('\n📊 Company_1 ID:', company._id);

        // Update applications to have proper status
        const updateResult = await Application.updateMany(
            { companyId: company._id },
            { 
                $set: { 
                    overallStatus: 'approved',
                    applicationStatus: 'hired',
                    supervisorStatus: 'approved',
                    companyStatus: 'approved',
                    isCurrentlyHired: true,
                    appliedAt: new Date('2025-09-05'),
                    hiringDate: new Date('2025-09-07'),
                    supervisorReviewedAt: new Date('2025-09-06'),
                    companyReviewedAt: new Date('2025-09-07'),
                    interviewDetails: {
                        type: 'remote',
                        date: new Date('2025-10-10'),
                        time: '09:00',
                        location: 'Remote',
                        meetingLink: 'https://meet.google.com/abc-def-ghi'
                    }
                }
            }
        );

        console.log('\n✅ Updated Applications:', updateResult);

        // Verify the changes
        const updatedApplications = await Application.find({ companyId: company._id });
        console.log('\n📋 Updated Applications:');
        updatedApplications.forEach((app, index) => {
            console.log(`${index + 1}. Student: ${app.studentName}, OverallStatus: ${app.overallStatus}`);
            console.log(`   Roll: ${app.studentProfile?.rollNumber}, Email: ${app.studentEmail}`);
            console.log(`   ApplicationStatus: ${app.applicationStatus}, IsHired: ${app.isCurrentlyHired}`);
            console.log(`   Applied: ${app.appliedAt}, Hired: ${app.hiringDate}`);
        });

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

fixApplicationStatuses();
