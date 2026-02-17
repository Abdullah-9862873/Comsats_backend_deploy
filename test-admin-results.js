const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing Admin Results API...');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const Student = require('./models/Student');
    const InterneeEvaluation = require('./models/InterneeEvaluation');
    const Application = require('./models/Application');

    try {
      // Get students
      const students = await Student.find({}).lean();
      console.log(`📋 Found ${students.length} students`);

      // Get evaluations
      const studentIds = students.map(s => s._id);
      const evaluations = await InterneeEvaluation.find({ 
        studentId: { $in: studentIds } 
      }).lean();
      console.log(`📋 Found ${evaluations.length} evaluations`);

      // Get applications
      const applications = await Application.find({
        studentId: { $in: studentIds }
      }).populate('companyId', 'name').lean();

      // Process each student like the admin endpoint does
      const results = students.map(student => {
        const studentEvaluations = evaluations.filter(
          eval => eval.studentId && eval.studentId.toString() === student._id.toString()
        );

        console.log(`\n--- Processing ${student.fullName || student.name} ---`);
        console.log(`Student ID: ${student._id}`);
        console.log(`Evaluations found: ${studentEvaluations.length}`);

        // Calculate final grade using fixed logic
        let finalGrade = 'Not Evaluated';
        let totalScore = 0;
        let evaluationCount = 0;

        studentEvaluations.forEach(evaluation => {
          console.log(`Evaluation data:`, {
            totalMarks: evaluation.totalMarks,
            maxMarks: evaluation.maxMarks
          });
          
          if (evaluation.totalMarks && evaluation.maxMarks) {
            // Calculate percentage from totalMarks/maxMarks
            const percentage = (evaluation.totalMarks / evaluation.maxMarks) * 100;
            console.log(`Calculated percentage: ${percentage}%`);
            totalScore += percentage;
            evaluationCount++;
          }
        });

        if (evaluationCount > 0) {
          const averageScore = totalScore / evaluationCount;
          console.log(`Average score: ${averageScore}%`);
          
          if (averageScore >= 90) finalGrade = 'A+';
          else if (averageScore >= 85) finalGrade = 'A';
          else if (averageScore >= 80) finalGrade = 'B+';
          else if (averageScore >= 75) finalGrade = 'B';
          else if (averageScore >= 70) finalGrade = 'C+';
          else if (averageScore >= 65) finalGrade = 'C';
          else if (averageScore >= 60) finalGrade = 'D';
          else finalGrade = 'F';
        }

        console.log(`Final grade: ${finalGrade}`);
        console.log(`Total marks: ${evaluationCount > 0 ? Math.round(totalScore / evaluationCount) : 0}`);

        return {
          studentInfo: {
            name: student.fullName || student.name || 'Unknown',
            rollNumber: student.rollNumber || 'N/A',
          },
          evaluation: {
            grade: finalGrade,
            totalMarks: evaluationCount > 0 ? Math.round(totalScore / evaluationCount) : 0,
            averageScore: evaluationCount > 0 ? (totalScore / evaluationCount).toFixed(2) : 0,
            evaluationCount,
            status: evaluationCount > 0 ? 'Completed' : 'Pending'
          }
        };
      });

      console.log('\n📊 FINAL RESULTS:');
      results.forEach(result => {
        console.log(`${result.studentInfo.name}: ${result.evaluation.totalMarks}/100 (${result.evaluation.grade})`);
      });

    } catch (error) {
      console.error('❌ Error:', error);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });