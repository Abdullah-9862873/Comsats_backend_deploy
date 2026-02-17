const mongoose = require('mongoose');
const Application = require('./models/Application');

mongoose.connect('mongodb://localhost:27017/FYP_Project')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check the applications for the specific company
    const companyId = '68ce61622faa3e9026187e8f';
    const applications = await Application.find({ company: companyId });
    
    console.log('\n=== Applications for Company', companyId, '===');
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`);
      console.log(`  ID: ${app._id}`);
      console.log(`  Student: ${app.student}`);
      console.log(`  Status: '${app.applicationStatus}'`);
      console.log(`  Offer Status: '${app.offerStatus}'`);
      console.log(`  Hiring Date: ${app.hiringDate}`);
      console.log(`  Created: ${app.createdAt}`);
      console.log('---');
    });
    
    // Check distinct statuses
    const statuses = await Application.distinct('applicationStatus', { company: companyId });
    console.log('\nDistinct statuses for this company:', statuses);
    
    // Check for any applications with offerStatus accepted
    const acceptedOffers = await Application.find({ 
      company: companyId, 
      offerStatus: 'accepted' 
    });
    console.log('\nApplications with accepted offers:', acceptedOffers.length);
    acceptedOffers.forEach(app => {
      console.log(`  - App ID: ${app._id}, Status: '${app.applicationStatus}', OfferStatus: '${app.offerStatus}'`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });