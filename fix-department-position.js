const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');
const Job = require('./models/Job');

async function fixStudentDepartmentAndPosition() {
  try {
    await mongoose.connect('mongodb+srv://fyp-internship:UiPh7dU2s3qC6Nls@fyp-internship-cluster.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔌 Connected to MongoDB');

    // 1. Fix student departments
    const students = await User.find({ role: 'student' });
    console.log('👨‍🎓 Found students:', students.length);

    const departments = ['Computer Science', 'Software Engineering', 'Information Technology', 'Data Science', 'Cybersecurity'];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const randomDept = departments[i % departments.length];
      
      // Update student department
      await User.updateOne(
        { _id: student._id },
        { 
          department: randomDept,
          $set: {
            'student.department': randomDept,
            'student.semester': Math.floor(Math.random() * 8) + 1
          }
        }
      );
      
      console.log(`✅ Updated ${student.name} - Department: ${randomDept}`);
    }

    // 2. Fix job positions
    const jobs = await Job.find();
    console.log('💼 Found jobs:', jobs.length);

    const positions = [
      'Software Developer',
      'Frontend Developer', 
      'Backend Developer',
      'Full Stack Developer',
      'Data Scientist',
      'UI/UX Designer',
      'DevOps Engineer',
      'Quality Assurance Engineer',
      'Business Analyst',
      'Project Manager'
    ];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const randomPosition = positions[i % positions.length];
      const randomDept = departments[i % departments.length];
      
      await Job.updateOne(
        { _id: job._id },
        { 
          position: randomPosition,
          department: randomDept
        }
      );
      
      console.log(`✅ Updated Job ${job.title} - Position: ${randomPosition}, Department: ${randomDept}`);
    }

    // 3. Update applications with proper positions
    const applications = await Application.find({ isCurrentlyHired: true });
    console.log('📋 Found hired applications:', applications.length);

    for (const app of applications) {
      const job = await Job.findById(app.jobId);
      if (job) {
        await Application.updateOne(
          { _id: app._id },
          { 
            jobPosition: job.position,
            department: job.department
          }
        );
        console.log(`✅ Updated application for job: ${job.title} - Position: ${job.position}`);
      }
    }

    console.log('🎉 All data updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixStudentDepartmentAndPosition();
