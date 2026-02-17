const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/Fyp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🔗 Connected to MongoDB');

  try {
    // Get all student users (they're stored as 'intern' role)
    const students = await User.find({ role: 'intern' });
    console.log(`📚 Found ${students.length} student users`);

    if (students.length === 0) {
      console.log('⚠️ No intern users found. Checking available roles...');
      const allUsers = await User.find({});
      const roles = [...new Set(allUsers.map(u => u.role))];
      console.log('Available roles:', roles);
      return;
    }

    const departments = [
      'Computer Science',
      'Software Engineering', 
      'Information Technology',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Business Administration',
      'Data Science'
    ];

    let count = 0;
    for (const student of students) {
      // Generate sample student profile data
      const regNo = `FA21-BSE-${(100 + count).toString().padStart(3, '0')}`;
      const department = departments[count % departments.length];
      const semester = Math.floor(Math.random() * 4) + 5; // 5th to 8th semester

      // Update the student profile
      await User.findByIdAndUpdate(student._id, {
        $set: {
          student: {
            regNo: regNo,
            department: department,
            semester: `${semester}th`
          }
        }
      });

      console.log(`✅ Updated ${student.name} (${student.email}):`);
      console.log(`   Registration: ${regNo}`);
      console.log(`   Department: ${department}`);
      console.log(`   Semester: ${semester}th`);
      
      count++;
    }

    console.log(`\n🎉 Successfully updated ${count} student profiles!`);

    // Verify the updates
    const updatedStudent = await User.findOne({ role: 'intern' });
    console.log('\n📋 Sample updated student:', {
      name: updatedStudent.name,
      email: updatedStudent.email,
      regNo: updatedStudent.student?.regNo,
      department: updatedStudent.student?.department,
      semester: updatedStudent.student?.semester
    });

  } catch (error) {
    console.error('❌ Error updating student profiles:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔚 Disconnected from MongoDB');
  }
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error);
});