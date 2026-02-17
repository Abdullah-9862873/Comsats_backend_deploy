const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function setupAllCompaniesData() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        // Get all companies
        const companies = await User.find({ role: 'company' });
        console.log(`\n📊 Found ${companies.length} companies`);

        // Get all students 
        const students = await User.find({ role: 'student' });
        console.log(`📊 Found ${students.length} students`);

        // Get all supervisors
        const supervisors = await User.find({ role: 'supervisor' });
        console.log(`📊 Found ${supervisors.length} supervisors`);

        if (students.length === 0) {
            console.log('❌ No students found! Cannot create applications.');
            return;
        }

        // For each company, ensure they have at least 2-3 hired students
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            console.log(`\n🏢 Processing Company: ${company.name || company.username || company._id}`);

            // Check existing accepted applications
            const existingAccepted = await Application.find({
                companyId: company._id,
                overallStatus: 'approved'
            });

            console.log(`   Existing accepted applications: ${existingAccepted.length}`);

            // If company already has accepted applications, skip
            if (existingAccepted.length >= 2) {
                console.log('   ✅ Company already has enough hired students');
                continue;
            }

            // Update existing applications to approved if any exist
            const existingApps = await Application.find({ companyId: company._id });
            if (existingApps.length > 0) {
                console.log(`   📝 Updating ${existingApps.length} existing applications to approved`);
                await Application.updateMany(
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
                            companyReviewedAt: new Date('2025-09-07')
                        }
                    }
                );
            }

            // Create additional applications if needed
            const targetCount = 3;
            const currentCount = Math.max(existingApps.length, existingAccepted.length);
            const neededCount = targetCount - currentCount;

            if (neededCount > 0) {
                console.log(`   📝 Creating ${neededCount} new applications`);
                
                // Get a random supervisor
                const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];
                
                for (let j = 0; j < neededCount && j < students.length; j++) {
                    const student = students[(i * 3 + j) % students.length]; // Distribute students across companies
                    
                    // Check if this student already has an application with this company
                    const existingApp = await Application.findOne({
                        companyId: company._id,
                        studentId: student._id
                    });

                    if (existingApp) {
                        console.log(`     - Student ${student.name || student.username} already has application, skipping`);
                        continue;
                    }

                    const newApplication = new Application({
                        studentId: student._id,
                        studentName: student.name || student.username || `Student_${j + 1}`,
                        studentEmail: student.email,
                        studentProfile: {
                            rollNumber: `SP22-BCS-${String(i * 3 + j + 1).padStart(3, '0')}`,
                            department: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'][j % 3],
                            semester: '5th',
                            cgpa: (3.0 + Math.random() * 1.0).toFixed(2),
                            phoneNumber: `+92300123456${j}`,
                            attendance: 85 + Math.floor(Math.random() * 15),
                            backlogs: 0
                        },
                        jobId: new mongoose.Types.ObjectId(),
                        jobTitle: 'Software Developer',
                        companyId: company._id,
                        companyName: company.name || company.username || 'Tech Company',
                        supervisorId: supervisor._id,
                        supervisorName: supervisor.name || supervisor.username || 'Supervisor_1',
                        coverLetter: `I am interested in joining ${company.name || 'this company'} as a software developer intern.`,
                        
                        // Set all statuses to approved/hired
                        supervisorStatus: 'approved',
                        companyStatus: 'approved',
                        overallStatus: 'approved',
                        applicationStatus: 'hired',
                        isCurrentlyHired: true,
                        
                        // Set dates
                        appliedAt: new Date('2025-09-05'),
                        hiringDate: new Date('2025-09-07'),
                        supervisorReviewedAt: new Date('2025-09-06'),
                        companyReviewedAt: new Date('2025-09-07'),
                        
                        // Interview details
                        interviewDetails: {
                            type: 'remote',
                            date: new Date('2025-10-10'),
                            time: '09:00',
                            location: 'Remote',
                            meetingLink: 'https://meet.google.com/abc-def-ghi'
                        }
                    });

                    await newApplication.save();
                    console.log(`     ✅ Created application for ${student.name || student.username}`);
                }
            }

            // Verify final count
            const finalCount = await Application.countDocuments({
                companyId: company._id,
                overallStatus: 'approved'
            });
            console.log(`   🎯 Final accepted applications: ${finalCount}`);
        }

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
        console.log('\n✅ All companies now have hired students for evaluation!');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

setupAllCompaniesData();
