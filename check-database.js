const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/FYP_Project')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== Database Collections ===');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check if we have any data in any collection
    for (let col of collections) {
      try {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} documents`);
      } catch (err) {
        console.log(`  ${col.name}: Error counting - ${err.message}`);
      }
    }
    
    // Check raw applications collection specifically
    try {
      const rawApps = await mongoose.connection.db.collection('applications').find({}).toArray();
      console.log('\n=== Raw Applications Collection ===');
      console.log(`Found ${rawApps.length} raw applications`);
      
      if (rawApps.length > 0) {
        rawApps.slice(0, 3).forEach((app, index) => {
          console.log(`\nApplication ${index + 1}:`);
          console.log(`  ID: ${app._id}`);
          console.log(`  Company: ${app.company}`);
          console.log(`  Student: ${app.student}`);
          console.log(`  Status: '${app.applicationStatus}'`);
          console.log(`  Offer Status: '${app.offerStatus}'`);
          console.log(`  Hiring Date: ${app.hiringDate}`);
        });
      }
    } catch (err) {
      console.log('Error checking raw applications:', err.message);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });