const express = require('express');
const router = express.Router();
const SupervisorEvaluation = require('../models/SupervisorEvaluation');

// Admin endpoint to create test supervisor evaluations
router.post('/create-test-supervisor-evaluations', async (req, res) => {
  try {
    console.log('🔧 Creating test supervisor evaluations...');
    
    const supervisorId = '68ba833c1d183b72f00855d9'; // Supervisor_1 ID

    const testEvaluations = [
      {
        studentId: '68ba82771d183b72f0085585', // Student_1
        studentName: 'Student_1',
        studentRegistration: 'SP22-BCS-006',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-01'),
        internshipEndDate: new Date('2024-12-01'),
        position: 'Java Developer',
        platformActivity: 8,
        completionOfInternship: 9,
        earningsAchieved: 7,
        skillDevelopment: 8,
        clientRating: 8,
        professionalism: 8,
        totalMarks: 48, // 48/60 = 80%
        grade: 'B+'
      },
      {
        studentId: '68ba97459dac321ab5ec45ad', // Student_2
        studentName: 'Student_2',
        studentRegistration: 'SP22-BCS-002',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-08'),
        internshipEndDate: new Date('2024-12-08'),
        position: 'Java Developer',
        platformActivity: 9,
        completionOfInternship: 10,
        earningsAchieved: 8,
        skillDevelopment: 9,
        clientRating: 9,
        professionalism: 9,
        totalMarks: 54, // 54/60 = 90%
        grade: 'A'
      },
      {
        studentId: '68bbee20471e9216fbd0bb1d', // Student_5
        studentName: 'Student_5',
        studentRegistration: 'SP22-BCS-005',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-15'),
        internshipEndDate: new Date('2024-12-15'),
        position: 'Computer Vision Engineer',
        platformActivity: 9,
        completionOfInternship: 8,
        earningsAchieved: 8,
        skillDevelopment: 10,
        clientRating: 9,
        professionalism: 8,
        totalMarks: 52, // 52/60 = 87%
        grade: 'A'
      },
      {
        studentId: '68c1689a6909d193253ba601', // Student_7
        studentName: 'Student_7',
        studentRegistration: 'SP22-BCS-020',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-06-01'),
        internshipEndDate: new Date('2024-08-31'),
        position: 'AI Engineer',
        platformActivity: 8,
        completionOfInternship: 8,
        earningsAchieved: 7,
        skillDevelopment: 9,
        clientRating: 8,
        professionalism: 8,
        totalMarks: 48, // 48/60 = 80%
        grade: 'B+'
      }
    ];

    const results = [];
    
    for (const evalData of testEvaluations) {
      try {
        // Check if evaluation already exists
        const existing = await SupervisorEvaluation.findOne({
          studentId: evalData.studentId,
          supervisorId: evalData.supervisorId
        });

        if (existing) {
          results.push({
            student: evalData.studentName,
            status: 'already_exists',
            totalMarks: existing.totalMarks
          });
          continue;
        }

        // Create new evaluation
        const evaluation = new SupervisorEvaluation(evalData);
        await evaluation.save();
        
        results.push({
          student: evalData.studentName,
          status: 'created',
          totalMarks: evalData.totalMarks,
          grade: evalData.grade
        });
        
      } catch (error) {
        results.push({
          student: evalData.studentName,
          status: 'error',
          error: error.message
        });
      }
    }

    // Get final count
    const totalEvals = await SupervisorEvaluation.countDocuments({ supervisorId });
    
    res.json({
      success: true,
      message: 'Test supervisor evaluations processing completed',
      results: results,
      totalEvaluations: totalEvals
    });

  } catch (error) {
    console.error('Error creating test evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test supervisor evaluations',
      error: error.message
    });
  }
});

module.exports = router;
