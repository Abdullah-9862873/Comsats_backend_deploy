const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define models with loose schema
const studentSchema = new mongoose.Schema({}, { collection: 'students', strict: false });
const Student = mongoose.model('Student', studentSchema);

const offerLetterSchema = new mongoose.Schema({}, { collection: 'offerletters', strict: false });
const OfferLetter = mongoose.model('OfferLetter', offerLetterSchema);

const applicationSchema = new mongoose.Schema({}, { collection: 'applications', strict: false });
const Application = mongoose.model('Application', applicationSchema);

const companySchema = new mongoose.Schema({}, { collection: 'companies', strict: false });
const Company = mongoose.model('Company', companySchema);

async function searchAbdullahData() {
  try {
    console.log('=== SEARCHING FOR ABDULLAH STUDENT ===');
    
    // Find student by email or roll number
    const student = await Student.findOne({
      $or: [
        { email: 'abdullahjav634@gmail.com' },
        { rollNumber: 'SP22-BCS-006' }
      ]
    });
    
    if (!student) {
      console.log('❌ Student not found with email or roll number');
      return;
    }
    
    console.log('✅ Student found:', {
      id: student._id,
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      department: student.department
    });
    
    // Find offer letter for this student
    console.log('\n=== SEARCHING FOR OFFER LETTER ===');
    const offerLetter = await OfferLetter.findOne({ studentId: student._id });
    
    if (offerLetter) {
      console.log('✅ Offer Letter found:', {
        id: offerLetter._id,
        studentId: offerLetter.studentId,
        companyId: offerLetter.companyId,
        startDate: offerLetter.startDate,
        endDate: offerLetter.endDate,
        position: offerLetter.position,
        status: offerLetter.status,
        createdAt: offerLetter.createdAt,
        updatedAt: offerLetter.updatedAt
      });
      
      // Get company details
      if (offerLetter.companyId) {
        const company = await Company.findById(offerLetter.companyId);
        if (company) {
          console.log('🏢 Company details:', {
            name: company.companyName || company.name,
            id: company._id
          });
        }
      }
    } else {
      console.log('❌ No offer letter found for this student');
    }
    
    // Search for applications
    console.log('\n=== SEARCHING FOR APPLICATIONS ===');
    const applications = await Application.find({ studentId: student._id });
    
    if (applications.length > 0) {
      console.log(`✅ Found ${applications.length} application(s):`);
      applications.forEach((app, index) => {
        console.log(`Application ${index + 1}:`, {
          id: app._id,
          companyId: app.companyId,
          status: app.status,
          appliedAt: app.appliedAt,
          startDate: app.startDate,
          endDate: app.endDate
        });
      });
    } else {
      console.log('❌ No applications found for this student');
    }
    
    // Search all offer letters that might belong to this student (by different criteria)
    console.log('\n=== ALTERNATIVE SEARCH FOR OFFER LETTERS ===');
    const allOfferLetters = await OfferLetter.find({});
    console.log(`Total offer letters in database: ${allOfferLetters.length}`);
    
    // Check if there are any offer letters with email or roll number in other fields
    const possibleOffers = allOfferLetters.filter(offer => {
      const offerString = JSON.stringify(offer);
      return offerString.includes('abdullahjav634@gmail.com') || 
             offerString.includes('SP22-BCS-006') ||
             offerString.includes('Abdullah');
    });
    
    if (possibleOffers.length > 0) {
      console.log('🔍 Found possible matches:');
      possibleOffers.forEach((offer, index) => {
        console.log(`Possible Match ${index + 1}:`, {
          id: offer._id,
          studentId: offer.studentId,
          companyId: offer.companyId,
          startDate: offer.startDate,
          endDate: offer.endDate,
          fullData: offer
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error searching data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔍 Search complete. Database connection closed.');
  }
}

searchAbdullahData();