// Test script to simulate a proper weekly report submission
const mongoose = require('mongoose');
require('dotenv').config();

// Models
const WeeklyReport = require('./models/WeeklyReport');
const WeeklyReportEvent = require('./models/WeeklyReportEvent');

async function createCleanTestReport() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Test data with various edge cases
    const testSubmissions = [
      {
        description: 'Clean data - all fields filled',
        data: {
          studentId: '60f1b2b3c1234567890abcde',
          studentName: 'Test Student Clean',
          studentRollNo: 'CIIT/FA21-BSE-999/CII',
          supervisorId: '60f1b2b3c1234567890abcdf',
          supervisorName: 'Prof. Test',
          weekEventId: '60f1b2b3c1234567890abce0',
          weekNumber: 4,
          reportTitle: 'Week 4 Clean Test Report',
          tasksCompleted: 'Successfully implemented user authentication module with JWT tokens and bcrypt password hashing. Completed unit tests for all authentication endpoints.',
          challengesFaced: 'Initially struggled with async/await patterns in Node.js, but learned proper error handling and promise management.',
          reflections: 'Gained valuable experience in security best practices. Understanding of middleware concept improved significantly.',
          supportingMaterials: 'GitHub repository: https://github.com/test/auth-module. Screenshots of working authentication flow attached.',
          plansForNextWeek: 'Start working on role-based access control and implement admin dashboard features.',
          companyName: 'Clean Test Company',
          companyLocation: 'Islamabad',
          dueDate: new Date(),
          submissionMetadata: {
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser',
            submissionMethod: 'web'
          }
        }
      },
      {
        description: 'Edge case data - some empty fields',
        data: {
          studentId: '60f1b2b3c1234567890abcde',
          studentName: 'Test Student Edge',
          studentRollNo: 'CIIT/FA21-BSE-888/CII',
          supervisorId: '60f1b2b3c1234567890abcdf',
          supervisorName: 'Prof. Test',
          weekEventId: '60f1b2b3c1234567890abce1',
          weekNumber: 5,
          reportTitle: 'Week 5 Edge Case Test Report',
          tasksCompleted: 'Basic setup completed',
          challengesFaced: '', // Empty string
          reflections: 'undefined', // Literal "undefined"
          supportingMaterials: '   ', // Just spaces
          plansForNextWeek: null, // null value
          companyName: 'Edge Test Company',
          companyLocation: 'Lahore',
          dueDate: new Date(),
          submissionMetadata: {
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser',
            submissionMethod: 'web'
          }
        }
      }
    ];

    for (const test of testSubmissions) {
      console.log(`\n📝 Creating ${test.description}...`);
      
      // Apply the same data sanitization logic as in the controller
      const sanitizedData = {
        ...test.data,
        tasksCompleted: (test.data.tasksCompleted && test.data.tasksCompleted.trim() !== '') ? test.data.tasksCompleted.trim() : '',
        challengesFaced: (test.data.challengesFaced && test.data.challengesFaced.trim() !== '') ? test.data.challengesFaced.trim() : '',
        reflections: (test.data.reflections && test.data.reflections.trim() !== '' && test.data.reflections !== 'undefined') ? test.data.reflections.trim() : '',
        supportingMaterials: (test.data.supportingMaterials && test.data.supportingMaterials.trim() !== '') ? test.data.supportingMaterials.trim() : '',
        plansForNextWeek: (test.data.plansForNextWeek && test.data.plansForNextWeek.trim() !== '' && test.data.plansForNextWeek !== 'undefined') ? test.data.plansForNextWeek.trim() : '',
      };
      
      console.log('Original data:', {
        tasksCompleted: `"${test.data.tasksCompleted}" (${test.data.tasksCompleted?.length || 'null'})`,
        challengesFaced: `"${test.data.challengesFaced}" (${test.data.challengesFaced?.length || 'null'})`,
        reflections: `"${test.data.reflections}" (${test.data.reflections?.length || 'null'})`,
        plansForNextWeek: `"${test.data.plansForNextWeek}" (${test.data.plansForNextWeek?.length || 'null'})`,
        supportingMaterials: `"${test.data.supportingMaterials}" (${test.data.supportingMaterials?.length || 'null'})`
      });
      
      console.log('Sanitized data:', {
        tasksCompleted: `"${sanitizedData.tasksCompleted}" (${sanitizedData.tasksCompleted?.length})`,
        challengesFaced: `"${sanitizedData.challengesFaced}" (${sanitizedData.challengesFaced?.length})`,
        reflections: `"${sanitizedData.reflections}" (${sanitizedData.reflections?.length})`,
        plansForNextWeek: `"${sanitizedData.plansForNextWeek}" (${sanitizedData.plansForNextWeek?.length})`,
        supportingMaterials: `"${sanitizedData.supportingMaterials}" (${sanitizedData.supportingMaterials?.length})`
      });
      
      const report = new WeeklyReport(sanitizedData);
      const savedReport = await report.save();
      
      console.log(`✅ Created report with ID: ${savedReport._id}`);
      console.log('Final stored data check:', {
        tasksCompleted: `"${savedReport.tasksCompleted}" (${savedReport.tasksCompleted?.length})`,
        challengesFaced: `"${savedReport.challengesFaced}" (${savedReport.challengesFaced?.length})`,
        reflections: `"${savedReport.reflections}" (${savedReport.reflections?.length})`,
        plansForNextWeek: `"${savedReport.plansForNextWeek}" (${savedReport.plansForNextWeek?.length})`,
        supportingMaterials: `"${savedReport.supportingMaterials}" (${savedReport.supportingMaterials?.length})`
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

createCleanTestReport();
