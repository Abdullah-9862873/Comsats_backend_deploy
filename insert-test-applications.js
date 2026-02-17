const mongoose = require('mongoose');

// Use the same MongoDB connection as the backend
const MONGO_URI = 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.name);
    
    // Create test applications directly in the database with minimal required fields
    const applications = [
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        studentName: 'John Doe',
        studentEmail: 'john@example.com',
        studentProfile: {
          department: 'Computer Science',
          semester: '8th'
        },
        jobId: new mongoose.Types.ObjectId(),
        jobTitle: 'Software Developer Intern',
        companyId: new mongoose.Types.ObjectId('68ce61622faa3e9026187e8f'), // Use your company ID
        companyName: 'TechCorp Solutions',
        supervisorId: new mongoose.Types.ObjectId(),
        supervisorName: 'Dr. Smith',
        coverLetter: 'Test cover letter',
        supervisorStatus: 'approved',
        companyStatus: 'approved',
        overallStatus: 'approved',
        applicationStatus: 'hired',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        hiringDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        offerStatus: 'accepted'
      },
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        studentName: 'Jane Smith',
        studentEmail: 'jane@example.com',
        studentProfile: {
          department: 'Computer Science',
          semester: '8th'
        },
        jobId: new mongoose.Types.ObjectId(),
        jobTitle: 'Software Developer Intern',
        companyId: new mongoose.Types.ObjectId('68ce61622faa3e9026187e8f'), // Use your company ID
        companyName: 'TechCorp Solutions',
        supervisorId: new mongoose.Types.ObjectId(),
        supervisorName: 'Dr. Smith',
        coverLetter: 'Test cover letter',
        supervisorStatus: 'approved',
        companyStatus: 'approved',
        overallStatus: 'approved',
        applicationStatus: 'hired',
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        hiringDate: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
        offerStatus: 'accepted'
      },
      {
        _id: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        studentName: 'Bob Wilson',
        studentEmail: 'bob@example.com',
        studentProfile: {
          department: 'Computer Science',
          semester: '8th'
        },
        jobId: new mongoose.Types.ObjectId(),
        jobTitle: 'Software Developer Intern',
        companyId: new mongoose.Types.ObjectId('68ce61622faa3e9026187e8f'), // Use your company ID
        companyName: 'TechCorp Solutions',
        supervisorId: new mongoose.Types.ObjectId(),
        supervisorName: 'Dr. Smith',
        coverLetter: 'Test cover letter',
        supervisorStatus: 'approved',
        companyStatus: 'pending',
        overallStatus: 'supervisor_approved',
        applicationStatus: 'pending',
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Insert directly into the collection
    const result = await mongoose.connection.db.collection('applications').insertMany(applications);
    console.log(`✅ Inserted ${result.insertedCount} test applications`);
    
    // Verify the data
    const inserted = await mongoose.connection.db.collection('applications').find({
      companyId: new mongoose.Types.ObjectId('68ce61622faa3e9026187e8f')
    }).toArray();
    
    console.log('\n📋 Verification:');
    inserted.forEach((app, index) => {
      console.log(`${index + 1}. ${app.studentName} - Status: '${app.applicationStatus}' - Supervisor: '${app.supervisorStatus}' - Company: '${app.companyStatus}'`);
    });
    
    console.log(`\n🎯 You should now see ${inserted.filter(app => app.applicationStatus === 'hired').length} hired students in the frontend!`);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });