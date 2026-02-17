const mongoose = require('mongoose');
const Application = require('./models/Application');
const CompanyProfile = require('./models/CompanyProfile');

mongoose.connect('mongodb://localhost:27017/FYP_Project')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all companies with applications
    const allApplications = await Application.find({})
      .populate('company', 'companyName')
      .populate('student', 'rollNo name');
    
    console.log('\n=== All Applications ===');
    console.log(`Total applications: ${allApplications.length}`);
    
    // Group by company
    const companiesWithApps = {};
    allApplications.forEach(app => {
      const companyId = app.company?._id?.toString();
      const companyName = app.company?.companyName || 'Unknown Company';
      
      if (!companiesWithApps[companyId]) {
        companiesWithApps[companyId] = {
          name: companyName,
          applications: []
        };
      }
      
      companiesWithApps[companyId].applications.push({
        id: app._id,
        student: app.student?.name || app.student?.rollNo || 'Unknown Student',
        status: app.applicationStatus,
        offerStatus: app.offerStatus,
        hiringDate: app.hiringDate
      });
    });
    
    // Display companies with applications
    Object.keys(companiesWithApps).forEach(companyId => {
      const company = companiesWithApps[companyId];
      console.log(`\n--- Company: ${company.name} (ID: ${companyId}) ---`);
      console.log(`Applications: ${company.applications.length}`);
      
      company.applications.forEach((app, index) => {
        console.log(`  ${index + 1}. Student: ${app.student}`);
        console.log(`     Status: '${app.status}'`);
        console.log(`     Offer Status: '${app.offerStatus}'`);
        console.log(`     Hiring Date: ${app.hiringDate}`);
      });
    });
    
    // Check for specific status patterns
    console.log('\n=== Status Analysis ===');
    const statusCounts = {};
    const offerStatusCounts = {};
    
    allApplications.forEach(app => {
      const status = app.applicationStatus || 'undefined';
      const offerStatus = app.offerStatus || 'undefined';
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      offerStatusCounts[offerStatus] = (offerStatusCounts[offerStatus] || 0) + 1;
    });
    
    console.log('Application Status counts:', statusCounts);
    console.log('Offer Status counts:', offerStatusCounts);
    
    // Find applications that might be "hired"
    const possibleHired = allApplications.filter(app => 
      app.applicationStatus === 'hired' || 
      app.offerStatus === 'accepted' ||
      app.hiringDate
    );
    
    console.log(`\nPossible hired students: ${possibleHired.length}`);
    possibleHired.forEach(app => {
      console.log(`  - ${app.student?.name || app.student?.rollNo}: status='${app.applicationStatus}', offer='${app.offerStatus}', hired=${app.hiringDate}`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });