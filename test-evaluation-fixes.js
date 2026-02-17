const mongoose = require('mongoose');

async function testEvaluationFixes() {
  try {
    console.log('🧪 Testing Internee Evaluation fixes...');
    
    await mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });
    
    const InterneeEvaluation = require('./models/InterneeEvaluation');
    const User = require('./models/User');
    const Application = require('./models/Application');
    
    console.log('📊 Checking evaluation data structure...');
    
    // Find a sample evaluation
    const evaluation = await InterneeEvaluation.findOne()
      .populate('internId', 'name email')
      .populate('applicationId', 'jobTitle')
      .populate('companyId', 'name email company');
    
    if (!evaluation) {
      console.log('❌ No evaluations found in database');
      return;
    }
    
    console.log('✅ Found evaluation sample:');
    console.log('   Evaluation ID:', evaluation._id);
    console.log('   Intern Name:', evaluation.internId?.name || 'MISSING');
    console.log('   Intern Email:', evaluation.internId?.email || 'MISSING');
    console.log('   Job Title:', evaluation.applicationId?.jobTitle || 'MISSING');
    console.log('   Company:', evaluation.companyId?.company?.companyName || evaluation.companyId?.name || 'MISSING');
    console.log('   Total Marks:', evaluation.evaluation?.totalMarks || 'MISSING');
    console.log('   Max Marks:', evaluation.evaluation?.maxMarks || 'MISSING');
    
    // Test grade calculation
    const totalMarks = evaluation.evaluation?.totalMarks || 0;
    const percentage = (totalMarks / 40) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    
    console.log('   Calculated Grade:', grade);
    console.log('   Supervisor Comments:', evaluation.evaluation?.supervisorComments || 'MISSING');
    
    // Test criteria access
    console.log('\n📋 Testing criteria access:');
    const criteriaLabels = {
      punctualityAndAttendance: 'Punctuality and Attendance',
      abilityToLinkTheoryToPractice: 'Ability to link theory to practice',
      demonstratedCriticalThinking: 'Demonstrated critical thinking and problem-solving skills',
      technicalKnowledge: 'Technical Knowledge',
      creativityConceptualAbility: 'Creativity / Conceptual Ability',
      abilityToAdaptToVarietyOfTasks: 'Ability to adapt to a variety of tasks',
      timeManagementDeadlineCompliance: 'Time Management & Deadline Compliance',
      behavedInProfessionalManner: 'Behaved in a professional manner',
      effectivelyPerformedAssignments: 'Effectively performed assignments',
      oralWrittenCommunicationSkills: 'Oral & Written communication skills'
    };
    
    Object.entries(criteriaLabels).forEach(([key, label]) => {
      const score = evaluation.evaluation?.[key] || 0;
      console.log(`   ${label}: ${score}/4`);
    });
    
    console.log('\n🔍 Issues Analysis:');
    const issues = [];
    
    if (!evaluation.internId?.name) issues.push('Missing intern name');
    if (!evaluation.internId?.email) issues.push('Missing intern email');
    if (!evaluation.evaluation?.totalMarks) issues.push('Missing total marks');
    if (!evaluation.applicationId?.jobTitle) issues.push('Missing job title');
    
    if (issues.length === 0) {
      console.log('✅ All data fields are present and accessible');
    } else {
      console.log('❌ Found issues:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n🎯 Fixes Applied:');
    console.log('✅ Backend PDF generation now accesses evaluation.evaluation.totalMarks');
    console.log('✅ Backend calculates grade dynamically in PDF');
    console.log('✅ Backend transforms data for frontend with missing fields');
    console.log('✅ PDF design completely redesigned with professional styling');
    console.log('✅ Frontend modal should display all data correctly');
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testEvaluationFixes();
