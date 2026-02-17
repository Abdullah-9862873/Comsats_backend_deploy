// Create test data for internee evaluation system
const mongoose = require('mongoose');
require('dotenv').config();

async function createTestData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');
        
        // Import models
        const User = require('./models/User');
        const Application = require('./models/Application');
        const Job = require('./models/Job');
        
        // Get first company
        const company = await User.findOne({ role: 'company' });
        if (!company) {
            console.log('No company found. Please create a company first.');
            return;
        }
        
        console.log(`Using company: ${company.name} (${company.email})`);
        
        // Check for existing jobs for this company
        let job = await Job.findOne({ company: company._id });
        
        if (!job) {
            // Create a test job
            job = new Job({
                title: 'Software Development Intern',
                designation: 'Intern Developer',
                company: company._id,
                description: 'Full-stack development internship opportunity',
                requirements: ['React', 'Node.js', 'MongoDB'],
                location: 'Islamabad',
                duration: '3 months',
                stipend: 25000,
                postedBy: company._id,
                status: 'active'
            });
            
            await job.save();
            console.log(`Created test job: ${job.title}`);
        } else {
            console.log(`Using existing job: ${job.title}`);
        }
        
        // Get a test student
        let student = await User.findOne({ role: 'student' });
        
        if (!student) {
            // Create a test student
            student = new User({
                name: 'Test Student',
                email: 'test.student@gmail.com',
                password: '$2a$10$example.hash.for.testing.purposes.only',
                role: 'student',
                rollNumber: 'FA21-BSE-123',
                phoneNumber: '03001234567',
                isActive: true,
                isVerified: true
            });
            
            await student.save();
            console.log(`Created test student: ${student.name} (${student.rollNumber})`);
        } else {
            console.log(`Using existing student: ${student.name} (${student.rollNumber || student.email})`);
        }
        
        // Check if application already exists
        const existingApp = await Application.findOne({
            studentId: student._id,
            jobId: job._id,
            companyId: company._id
        });
        
        if (existingApp) {
            // Update existing application to approved status
            existingApp.overallStatus = 'approved';
            existingApp.companyStatus = 'approved';
            existingApp.supervisorStatus = 'approved';
            await existingApp.save();
            console.log('Updated existing application to approved status');
        } else {
            // Create a test application with approved status
            const application = new Application({
                studentId: student._id,
                studentName: student.name,
                studentEmail: student.email,
                studentProfile: {
                    rollNumber: student.rollNumber || 'FA21-BSE-123',
                    department: 'Computer Science',
                    semester: '7th',
                    cgpa: '3.5'
                },
                jobId: job._id,
                jobTitle: job.title,
                companyId: company._id,
                companyName: company.company?.companyName || company.name,
                coverLetter: 'Test cover letter for internship application',
                overallStatus: 'approved',
                companyStatus: 'approved',
                supervisorStatus: 'approved',
                appliedAt: new Date()
            });
            
            await application.save();
            console.log('Created approved test application');
        }
        
        // Verify the data
        console.log('\n=== VERIFICATION ===');
        const approvedApps = await Application.find({ 
            companyId: company._id,
            overallStatus: 'approved'
        })
        .populate('studentId', 'name email rollNumber')
        .populate('jobId', 'title designation');
        
        console.log(`Company ${company.name} now has ${approvedApps.length} approved application(s):`);
        approvedApps.forEach(app => {
            const studentInfo = app.studentId || { name: app.studentName, rollNumber: app.studentProfile?.rollNumber };
            const jobInfo = app.jobId || { title: app.jobTitle };
            console.log(`- ${studentInfo.name} (${studentInfo.rollNumber || studentInfo.email}) for ${jobInfo.title}`);
        });
        
        console.log('\n✅ Test data created successfully!');
        console.log('You can now:');
        console.log('1. Login as company: ' + company.email);
        console.log('2. Go to Internee Evaluation tab');
        console.log('3. Select the hired student and assign marks');
        
        await mongoose.disconnect();
        console.log('\nDatabase connection closed.');
        
    } catch (error) {
        console.error('Error creating test data:', error);
        process.exit(1);
    }
}

createTestData();
