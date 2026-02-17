const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected for updating dates');
    updateHiredApplicationDates();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const updateHiredApplicationDates = async () => {
  try {
    const Application = require('./models/Application');
    const OfferLetter = require('./models/OfferLetter');
    const User = require('./models/User');
    const Job = require('./models/Job');
    
    console.log('\n=== UPDATING HIRED APPLICATION DATES ===');
    
    // Find hired applications without dates
    const hiredApplications = await Application.find({
      isCurrentlyHired: true,
      overallStatus: 'approved',
      $or: [
        { startDate: { $exists: false } },
        { endDate: { $exists: false } },
        { startDate: null },
        { endDate: null }
      ]
    }).limit(10);
    
    console.log('Found applications without dates:', hiredApplications.length);
    
    // Generate sample dates for each application
    for (let i = 0; i < hiredApplications.length; i++) {
      const application = hiredApplications[i];
      
      // Generate realistic internship dates
      const startDate = new Date('2024-09-01'); // September start
      startDate.setDate(startDate.getDate() + (i * 7)); // Stagger start dates
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3); // 3 month internship
      
      // Update the application
      await Application.findByIdAndUpdate(application._id, {
        startDate: startDate,
        endDate: endDate
      });
      
      console.log(`Updated application ${i + 1}:`);
      console.log(`  Start Date: ${startDate.toISOString().split('T')[0]}`);
      console.log(`  End Date: ${endDate.toISOString().split('T')[0]}`);
      
      // Also create/update offer letter if needed
      const existingOffer = await OfferLetter.findOne({
        studentId: application.studentId,
        jobId: application.jobId
      });
      
      if (!existingOffer) {
        console.log(`  Creating offer letter for application ${i + 1}`);
        
        // Get student and job details for offer letter
        const student = await User.findById(application.studentId);
        const job = await Job.findById(application.jobId).populate('companyId');
        
        if (student && job) {
          const newOffer = new OfferLetter({
            applicationId: application._id,
            studentId: application.studentId,
            studentName: student.name,
            studentEmail: student.email,
            companyId: job.companyId._id,
            organizationName: job.companyId.name || 'Company Name',
            organizationAddress: 'Company Address',
            representativeName: 'HR Representative',
            representativePosition: 'HR Manager',
            jobId: application.jobId,
            jobTitle: job.title,
            supervisorId: application.supervisorId,
            supervisorName: 'Supervisor Name',
            startDate: startDate,
            endDate: endDate,
            offerLetterContent: `Dear ${student.name}, You are offered the position of ${job.title}...`,
            status: 'accepted'
          });
          
          await newOffer.save();
          console.log(`  ✅ Created offer letter`);
        }
      } else {
        // Update existing offer letter dates
        await OfferLetter.findByIdAndUpdate(existingOffer._id, {
          startDate: startDate,
          endDate: endDate,
          status: 'accepted'
        });
        console.log(`  ✅ Updated existing offer letter`);
      }
    }
    
    console.log('\n=== VERIFICATION ===');
    
    // Verify the updates
    const updatedApplications = await Application.find({
      isCurrentlyHired: true,
      overallStatus: 'approved',
      startDate: { $exists: true, $ne: null },
      endDate: { $exists: true, $ne: null }
    })
    .populate('studentId', 'name email student')
    .limit(5);
    
    console.log('Applications with dates now:', updatedApplications.length);
    
    updatedApplications.forEach((app, index) => {
      const startDate = app.startDate ? new Date(app.startDate).toISOString().split('T')[0] : 'N/A';
      const endDate = app.endDate ? new Date(app.endDate).toISOString().split('T')[0] : 'N/A';
      
      // Calculate duration
      let duration = 'N/A';
      if (app.startDate && app.endDate) {
        const start = new Date(app.startDate);
        const end = new Date(app.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.ceil(diffDays / 30);
        duration = `${months} month${months !== 1 ? 's' : ''}`;
      }
      
      console.log(`${index + 1}. ${app.studentId?.name || 'Unknown'}`);
      console.log(`   Start: ${startDate}, End: ${endDate}, Duration: ${duration}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Update error:', error);
    process.exit(1);
  }
};
