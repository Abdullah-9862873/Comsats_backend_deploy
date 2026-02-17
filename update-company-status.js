const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');

// Update all existing companies to have 'pending' status
async function updateCompanyStatuses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Internship-Portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Update all companies that don't have status field
    const result = await CompanyProfile.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'pending' } }
    );
    
    console.log(`Updated ${result.modifiedCount} companies with pending status`);
    
    // Check current status distribution
    const statusCounts = await CompanyProfile.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Current status distribution:', statusCounts);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateCompanyStatuses();