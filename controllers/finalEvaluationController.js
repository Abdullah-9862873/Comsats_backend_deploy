const InterneeEvaluation = require('../models/InterneeEvaluation');
const SupervisorEvaluation = require('../models/SupervisorEvaluation');
const Application = require('../models/Application');
const User = require('../models/User');
const Student = require('../models/Student');
const emailService = require('../services/emailService');

// Get final evaluations for students supervised by this supervisor
const getFinalEvaluations = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    console.log('📋 ===== FINAL EVALUATION API CALLED =====');
    console.log('📋 Fetching final evaluations for supervisor:', supervisorId);

    // Find applications where this supervisor is assigned and status is approved
    const applications = await Application.find({
      supervisorId,
      overallStatus: 'approved'
    }).populate('studentId', 'name email registrationNumber department student')
      .populate('companyId', 'name email company')
      .populate('jobId', 'title');

    if (applications.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const readyToSend = [];
    const resultsSent = [];

    for (const application of applications) {
      // Get supervisor evaluation
      const supervisorEval = await SupervisorEvaluation.findOne({
        studentId: application.studentId._id,
        supervisorId: supervisorId
      });

      console.log(`🔍 Student ${application.studentId.name}:`);
      console.log(`   - Supervisor Eval Found:`, !!supervisorEval);
      if (supervisorEval) {
        console.log(`   - Supervisor Total Marks:`, supervisorEval.totalMarks);
        console.log(`   - Final Result Sent:`, supervisorEval.finalResultSent);
        console.log(`   - Final Result Sent At:`, supervisorEval.finalResultSentAt);
      }

      // Get company evaluation
      const companyEval = await InterneeEvaluation.findOne({
        internId: application.studentId._id,
        applicationId: application._id
      });

      console.log(`   - Company Eval Found:`, !!companyEval);
      if (companyEval) {
        console.log(`   - Company Total/Max Marks:`, companyEval.evaluation?.totalMarks, '/', companyEval.evaluation?.maxMarks);
      }

      // Calculate final marks
      let supervisorMarks = 0;
      let companyMarks = 0;
      let totalMarks = 0;
      let grade = 'F';

      if (supervisorEval) {
        // Supervisor evaluation totalMarks is already calculated (6-60 range)
        // Scale it to 60% of final grade
        supervisorMarks = supervisorEval.totalMarks; // This is already out of 60
      }

      if (companyEval) {
        // Company evaluation totalMarks is out of maxMarks (usually 40)
        // Scale it to 40% of final grade
        const maxMarks = companyEval.evaluation?.maxMarks || 40;
        const totalMarks = companyEval.evaluation?.totalMarks || 0;
        companyMarks = Math.round((totalMarks / maxMarks) * 40); // Scale to 40 points
      }

      totalMarks = supervisorMarks + companyMarks;

      // Calculate grade
      const percentage = totalMarks;
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 85) grade = 'A';
      else if (percentage >= 80) grade = 'A-';
      else if (percentage >= 75) grade = 'B+';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 65) grade = 'B-';
      else if (percentage >= 60) grade = 'C+';
      else if (percentage >= 55) grade = 'C';
      else if (percentage >= 50) grade = 'C-';
      else if (percentage >= 40) grade = 'D';

      // Create evaluation object
      const evaluationData = {
        id: application._id,
        studentInfo: {
          id: application.studentId._id,
          name: application.studentId.name,
          rollNumber: application.studentId.student?.regNo || application.studentId.registrationNumber || 'Not provided',
          department: application.studentId.student?.department || application.studentId.department || 'Computer Science',
          email: application.studentId.email
        },
        internshipInfo: {
          companyName: application.companyName || application.companyId?.company?.companyName || application.companyId?.name || 'Unknown Company',
          position: application.jobTitle || application.jobId?.title || 'Unknown Position',
          supervisorName: req.user.name,
          duration: '3 months', // Default, should come from application
          startDate: application.startDate || application.createdAt,
          endDate: application.endDate || new Date()
        },
        evaluation: {
          supervisorMarks,
          companyMarks,
          totalMarks,
          grade,
          finalSubmitted: !!supervisorEval?.finalResultSent,
          submittedDate: supervisorEval?.finalResultSentAt || new Date(),
          sentBy: supervisorEval?.finalResultSentBy
        },
        hasSupervisionEval: !!supervisorEval,
        hasCompanyEval: !!companyEval
      };

      // Separate into sections based on whether final result has been sent
      if (supervisorEval?.finalResultSent) {
        resultsSent.push(evaluationData);
      } else {
        readyToSend.push(evaluationData);
      }
    }

    console.log(`✅ Returning ${readyToSend.length} ready to send, ${resultsSent.length} results sent`);

    res.json({
      success: true,
      data: {
        readyToSend,
        resultsSent,
        summary: {
          totalEvaluations: readyToSend.length + resultsSent.length,
          readyToSendCount: readyToSend.length,
          resultsSentCount: resultsSent.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching final evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch final evaluations',
      error: error.message
    });
  }
};

// Send final result to student
const sendFinalResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisorId = req.user.id;

    console.log('📤 Sending final result for application:', applicationId);

    // Verify supervisor has access to this application
    const application = await Application.findOne({
      _id: applicationId,
      supervisorId
    }).populate('studentId', 'name email')
      .populate('companyId', 'name email company')
      .populate('jobId', 'title');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    const student = application.studentId;

    // Get both evaluations to calculate final result
    const supervisorEval = await SupervisorEvaluation.findOne({
      studentId: student._id,
      supervisorId: supervisorId
    });

    const companyEval = await InterneeEvaluation.findOne({
      internId: student._id,
      applicationId: applicationId
    });

    console.log('📊 Final result calculation:');
    console.log(`   - Supervisor Eval Found:`, !!supervisorEval);
    console.log(`   - Company Eval Found:`, !!companyEval);

    if (!supervisorEval || !companyEval) {
      return res.status(400).json({
        success: false,
        message: 'Both supervisor and company evaluations must be completed before sending final results'
      });
    }

    // Check if final result has already been sent
    if (supervisorEval.finalResultSent) {
      console.log('⚠️ Final result already sent on:', supervisorEval.finalResultSentAt);
      return res.status(400).json({
        success: false,
        message: 'Final result has already been sent to this student',
        sentAt: supervisorEval.finalResultSentAt,
        sentBy: supervisorEval.finalResultSentBy
      });
    }

    // Calculate final marks
    const supervisorMarks = supervisorEval.totalMarks; // Out of 60
    const companyTotalMarks = companyEval.evaluation?.totalMarks || 0;
    const companyMaxMarks = companyEval.evaluation?.maxMarks || 40;
    const companyMarks = Math.round((companyTotalMarks / companyMaxMarks) * 40); // Scale to 40 points

    const totalMarks = supervisorMarks + companyMarks;
    
    // Calculate grade
    let grade = 'F';
    if (totalMarks >= 90) grade = 'A+';
    else if (totalMarks >= 85) grade = 'A';
    else if (totalMarks >= 80) grade = 'A-';
    else if (totalMarks >= 75) grade = 'B+';
    else if (totalMarks >= 70) grade = 'B';
    else if (totalMarks >= 65) grade = 'B-';
    else if (totalMarks >= 60) grade = 'C+';
    else if (totalMarks >= 55) grade = 'C';
    else if (totalMarks >= 50) grade = 'C-';
    else if (totalMarks >= 40) grade = 'D';

    console.log(`   - Final calculation: ${supervisorMarks} + ${companyMarks} = ${totalMarks} (Grade: ${grade})`);

    // Get complete student profile data
    const studentProfile = await Student.findById(student._id);
    const completeStudentData = {
      ...student.toObject(),
      rollNo: studentProfile?.rollNumber || studentProfile?.rollNo || 'N/A',
      rollNumber: studentProfile?.rollNumber || studentProfile?.rollNo || 'N/A',
      registrationNumber: studentProfile?.rollNumber || studentProfile?.rollNo || 'N/A',
      department: studentProfile?.department || 'N/A'
    };

    // Prepare evaluation data
    const evaluationData = {
      totalMarks,
      supervisorMarks,
      companyMarks,
      grade
    };

    // Prepare internship info
    const internshipInfo = {
      companyName: application.companyName || application.companyId?.company?.companyName || application.companyId?.name || 'Company',
      position: application.jobTitle || application.jobId?.title || 'Internship Position'
    };

    // Send email notification to student
    try {
      console.log('📧 Sending final evaluation email to student...');
      
      await emailService.sendFinalEvaluationEmail(
        completeStudentData,
        req.user, // supervisor
        evaluationData,
        internshipInfo
      );
      
      console.log('✅ Final evaluation email sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending final evaluation email:', emailError);
      // Don't fail the request if email fails, but still mark as sent since the data is valid
    }

    // Mark final result as sent in the database
    try {
      await SupervisorEvaluation.findByIdAndUpdate(supervisorEval._id, {
        finalResultSent: true,
        finalResultSentAt: new Date(),
        finalResultSentBy: supervisorId
      });
      
      console.log('✅ Final result status updated in database');
    } catch (dbError) {
      console.error('❌ Error updating final result status:', dbError);
      // Continue even if DB update fails - the email was sent
    }

    console.log('✅ Final result sent successfully');

    res.json({
      success: true,
      message: 'Final result sent to student successfully',
      data: {
        totalMarks,
        grade,
        sentAt: new Date(),
        studentEmail: completeStudentData.email
      }
    });

  } catch (error) {
    console.error('Error sending final result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send final result',
      error: error.message
    });
  }
};

// View sent final result (read-only)
const viewSentResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisorId = req.user.id;

    console.log('👁️ Viewing sent final result for application:', applicationId);

    // Verify supervisor has access to this application
    const application = await Application.findOne({
      _id: applicationId,
      supervisorId
    }).populate('studentId', 'name email student')
      .populate('companyId', 'name email company')
      .populate('jobId', 'title');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    const student = application.studentId;

    // Get supervisor evaluation (must be sent)
    const supervisorEval = await SupervisorEvaluation.findOne({
      studentId: student._id,
      supervisorId: supervisorId,
      finalResultSent: true // Only show if already sent
    });

    if (!supervisorEval || !supervisorEval.finalResultSent) {
      return res.status(404).json({
        success: false,
        message: 'Final result has not been sent yet or evaluation not found'
      });
    }

    // Get company evaluation
    const companyEval = await InterneeEvaluation.findOne({
      internId: student._id,
      applicationId: applicationId
    });

    // Calculate final marks (same logic as sending)
    const supervisorMarks = supervisorEval.totalMarks;
    const companyTotalMarks = companyEval?.evaluation?.totalMarks || 0;
    const companyMaxMarks = companyEval?.evaluation?.maxMarks || 40;
    const companyMarks = Math.round((companyTotalMarks / companyMaxMarks) * 40);

    const totalMarks = supervisorMarks + companyMarks;
    
    // Calculate grade
    let grade = 'F';
    if (totalMarks >= 90) grade = 'A+';
    else if (totalMarks >= 85) grade = 'A';
    else if (totalMarks >= 80) grade = 'A-';
    else if (totalMarks >= 75) grade = 'B+';
    else if (totalMarks >= 70) grade = 'B';
    else if (totalMarks >= 65) grade = 'B-';
    else if (totalMarks >= 60) grade = 'C+';
    else if (totalMarks >= 55) grade = 'C';
    else if (totalMarks >= 50) grade = 'C-';
    else if (totalMarks >= 40) grade = 'D';

    console.log('✅ Retrieved sent final result');

    res.json({
      success: true,
      message: 'Final result details (already sent)',
      data: {
        applicationId: application._id,
        studentInfo: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.student?.regNo || 'N/A',
          department: student.student?.department || 'N/A'
        },
        internshipInfo: {
          companyName: application.companyName || application.companyId?.company?.companyName || application.companyId?.name || 'Company',
          position: application.jobTitle || application.jobId?.title || 'Internship Position'
        },
        evaluation: {
          totalMarks,
          supervisorMarks,
          companyMarks,
          grade,
          percentage: totalMarks
        },
        sentInfo: {
          sentAt: supervisorEval.finalResultSentAt,
          sentBy: supervisorEval.finalResultSentBy,
          alreadySent: true
        }
      }
    });

  } catch (error) {
    console.error('Error viewing sent result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view sent result',
      error: error.message
    });
  }
};

// Get student's final result
const getStudentResult = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log('📊 Fetching result for student:', studentId);

    // Find student's approved application
    const application = await Application.findOne({
      studentId,
      overallStatus: 'approved'
    }).populate('supervisorId', 'name email')
      .populate('companyId', 'name email company')
      .populate('jobId', 'title');

    if (!application) {
      return res.json({
        success: true,
        data: null,
        message: 'No approved internship found'
      });
    }

    // Get evaluations
    const supervisorEval = await SupervisorEvaluation.findOne({
      studentId,
      supervisorId: application.supervisorId._id
    });

    const companyEval = await InterneeEvaluation.findOne({
      internId: studentId,
      applicationId: application._id
    });

    console.log(`🔍 Student ${req.user.name} result check:`);
    console.log(`   - Supervisor Eval Found:`, !!supervisorEval);
    console.log(`   - Final Result Sent:`, supervisorEval?.finalResultSent);
    console.log(`   - Final Result Sent At:`, supervisorEval?.finalResultSentAt);

    // CRITICAL: Check if supervisor has sent the final result
    // Student can ONLY see results after supervisor explicitly sends them
    if (!supervisorEval || !supervisorEval.finalResultSent) {
      console.log('❌ Final result not yet sent by supervisor - access denied');
      return res.json({
        success: true,
        data: null,
        message: 'Your final evaluation results have not been released yet. Please wait for your supervisor to send them.',
        status: 'pending_supervisor_approval'
      });
    }

    console.log('✅ Final result has been sent - showing to student');

    // Calculate marks (same logic as supervisor endpoint)
    let supervisorMarks = 0;
    let companyMarks = 0;

    console.log(`   - Supervisor Total Marks:`, supervisorEval.totalMarks);
    supervisorMarks = supervisorEval.totalMarks; // This is already out of 60

    console.log(`   - Company Eval Found:`, !!companyEval);
    if (companyEval) {
      console.log(`   - Company Total/Max Marks:`, companyEval.evaluation?.totalMarks, '/', companyEval.evaluation?.maxMarks);
      // Company evaluation totalMarks is out of maxMarks (usually 40)
      // Scale it to 40% of final grade
      const maxMarks = companyEval.evaluation?.maxMarks || 40;
      const totalMarks = companyEval.evaluation?.totalMarks || 0;
      companyMarks = Math.round((totalMarks / maxMarks) * 40); // Scale to 40 points
    }

    const totalMarks = supervisorMarks + companyMarks;
    const percentage = totalMarks;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'A-';
    else if (percentage >= 75) grade = 'B+';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 65) grade = 'B-';
    else if (percentage >= 60) grade = 'C+';
    else if (percentage >= 55) grade = 'C';
    else if (percentage >= 50) grade = 'C-';
    else if (percentage >= 40) grade = 'D';

    const result = {
      studentInfo: {
        name: req.user.name,
        rollNumber: req.user.student?.regNo || req.user.registrationNumber || 'Not provided',
        department: req.user.student?.department || req.user.department || 'Computer Science',
        email: req.user.email
      },
      internshipInfo: {
        companyName: application.companyName || application.companyId?.company?.companyName || application.companyId?.name || 'Unknown Company',
        position: application.jobTitle || application.jobId?.title || 'Unknown Position',
        supervisorName: application.supervisorId?.name || 'Unknown Supervisor',
        duration: '3 months',
        startDate: application.startDate || application.createdAt,
        endDate: application.endDate || new Date()
      },
      evaluation: {
        supervisorMarks,
        companyMarks,
        totalMarks,
        grade,
        submittedDate: new Date(),
        isSubmitted: !!(supervisorEval && companyEval) // Both evaluations must exist
      },
      breakdown: {
        supervisorPercentage: 60,
        companyPercentage: 40,
        supervisorScore: supervisorMarks > 0 ? (supervisorMarks / 60) * 100 : 0,
        companyScore: companyMarks > 0 ? (companyMarks / 40) * 100 : 0
      }
    };

    console.log('✅ Student result fetched successfully');

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching student result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student result',
      error: error.message
    });
  }
};

module.exports = {
  getFinalEvaluations,
  sendFinalResult,
  viewSentResult,
  getStudentResult
};
