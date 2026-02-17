const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Updating misconduct report with correct company name...');
    
    // Get the correct company name from profile
    const companyId = '68ce61622faa3e9026187e8f';
    const profile = await mongoose.connection.db.collection('companyprofiles').findOne({
      user: new mongoose.Types.ObjectId(companyId)
    });
    
    const correctCompanyName = profile?.companyName || 'Tech Pro';
    console.log('Correct company name:', correctCompanyName);
    
    // Update the recent misconduct report
    const reportId = '68cfa3f9ffaefb5600090382'; // From the earlier check
    
    const result = await mongoose.connection.db.collection('misconductreports').updateOne(
      { _id: new mongoose.Types.ObjectId(reportId) },
      { $set: { companyName: correctCompanyName } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedReport = await mongoose.connection.db.collection('misconductreports').findOne({
      _id: new mongoose.Types.ObjectId(reportId)
    });
    
    console.log('Updated report company name:', updatedReport.companyName);
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });