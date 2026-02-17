const SupervisorEvaluation = require('../models/SupervisorEvaluation');
const Application = require('../models/Application');
const User = require('../models/User');

// Helper function to calculate grade based on total marks
const calculateGrade = (totalMarks) => {
  if (totalMarks >= 54) return 'A+'; // 90-100%
  if (totalMarks >= 48) return 'A';  // 80-89%
  if (totalMarks >= 42) return 'B+'; // 70-79%
  if (totalMarks >= 36) return 'B';  // 60-69%
  if (totalMarks >= 30) return 'C+'; // 50-59%
  if (totalMarks >= 24) return 'C';  // 40-49%
  if (totalMarks >= 18) return 'D';  // 30-39%
  return 'F'; // Below 30%
};

// Submit supervisor evaluation
const submitSupervisorEvaluation = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const {
      studentId,
      platformActivity,
      completionOfInternship,
      earningsAchieved,
      skillDevelopment,
      clientRating,
      professionalism
    } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student selection is required'
      });
    }

    // Validate grade values
    const grades = [platformActivity, completionOfInternship, earningsAchieved, skillDevelopment, clientRating, professionalism];
    for (let grade of grades) {
      if (!grade || grade < 1 || grade > 10) {
        return res.status(400).json({
          success: false,
          message: 'All grades must be between 1 and 10'
        });
      }
    }

    // Check if evaluation already exists
    const existingEvaluation = await SupervisorEvaluation.findOne({
      studentId,
      supervisorId
    });

    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation for this student already exists'
      });
    }

    // Get student and application details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const application = await Application.findOne({
      studentId,
      supervisorId,
      applicationStatus: 'hired'
    }).populate('jobId', 'jobTitle duration');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No hired application found for this student'
      });
    }

    // Get the offer letter for this student/job combination to get actual internship dates
    const OfferLetter = require('../models/OfferLetter');
    const offerLetter = await OfferLetter.findOne({
      studentId,
      status: { $in: ['accepted', 'sent'] } // Check both accepted and sent status
    });

    console.log('🔍 Offer letter found:', offerLetter ? 'YES' : 'NO');
    if (offerLetter) {
      console.log('📅 Offer letter details:', {
        status: offerLetter.status,
        startDate: offerLetter.startDate,
        endDate: offerLetter.endDate,
        organization: offerLetter.organizationName
      });
    }

    const supervisor = await User.findById(supervisorId);

    // Get internship data with offer letter dates taking priority
    const internshipDuration = application.jobId?.duration || application.duration || '3 Months';
    
    // Get dates from offer letter first, then application, then provide defaults
    let internshipStartDate = offerLetter?.startDate || application.startDate;
    let internshipEndDate = offerLetter?.endDate || application.endDate;
    
    // If still no dates, provide default academic year dates
    if (!internshipStartDate) {
      internshipStartDate = new Date('2025-01-15'); // Default winter semester start
    }
    if (!internshipEndDate) {
      internshipEndDate = new Date('2025-04-15'); // Default winter semester end
    }
    
    const position = application.jobPosition || application.jobTitle || application.jobId?.jobTitle || 'Unknown Position';

    console.log('🔍 Debug internship data for submission:', {
      duration: internshipDuration,
      startDate: internshipStartDate,
      endDate: internshipEndDate,
      position: position,
      'From Offer Letter': {
        startDate: offerLetter?.startDate,
        endDate: offerLetter?.endDate
      },
      'From Application': {
        startDate: application.startDate,
        endDate: application.endDate
      },
      jobDuration: application.jobId?.duration
    });

    // Calculate total marks and grade
    const totalMarks = parseInt(platformActivity) + parseInt(completionOfInternship) + 
                      parseInt(earningsAchieved) + parseInt(skillDevelopment) + 
                      parseInt(clientRating) + parseInt(professionalism);
    
    const grade = calculateGrade(totalMarks);

    // Create evaluation
    const evaluation = new SupervisorEvaluation({
      studentId,
      studentName: student.name,
      studentRegistration: student.student?.regNo || application.studentProfile?.rollNumber || 'N/A',
      supervisorId,
      supervisorName: supervisor.name,
      internshipDuration,
      internshipStartDate,
      internshipEndDate,
      position,
      platformActivity: parseInt(platformActivity),
      completionOfInternship: parseInt(completionOfInternship),
      earningsAchieved: parseInt(earningsAchieved),
      skillDevelopment: parseInt(skillDevelopment),
      clientRating: parseInt(clientRating),
      professionalism: parseInt(professionalism),
      totalMarks,
      grade
    });

    await evaluation.save();

    res.status(201).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: evaluation
    });

  } catch (error) {
    console.error('Error submitting supervisor evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit evaluation',
      error: error.message
    });
  }
};

// Get supervisor's submitted evaluations
const getSupervisorEvaluations = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const evaluations = await SupervisorEvaluation.find({ supervisorId })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: evaluations
    });

  } catch (error) {
    console.error('Error fetching supervisor evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations',
      error: error.message
    });
  }
};

// Get all evaluations (admin only)
const getAllSupervisorEvaluations = async (req, res) => {
  try {
    const evaluations = await SupervisorEvaluation.find()
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: evaluations
    });

  } catch (error) {
    console.error('Error fetching all supervisor evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations',
      error: error.message
    });
  }
};

// Get evaluation by ID
const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await SupervisorEvaluation.findById(id)
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation',
      error: error.message
    });
  }
};

// Update evaluation status
const updateEvaluationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['submitted', 'reviewed', 'finalized'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const evaluation = await SupervisorEvaluation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.json({
      success: true,
      message: 'Evaluation status updated successfully',
      data: evaluation
    });

  } catch (error) {
    console.error('Error updating evaluation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update evaluation status',
      error: error.message
    });
  }
};

module.exports = {
  submitSupervisorEvaluation,
  getSupervisorEvaluations,
  getAllSupervisorEvaluations,
  getEvaluationById,
  updateEvaluationStatus
};
