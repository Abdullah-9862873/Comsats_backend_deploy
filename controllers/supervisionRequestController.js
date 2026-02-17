const SupervisionRequest = require('../models/SupervisionRequest');
const Student = require('../models/Student');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createSupervisionRequestNotification } = require('./notificationController');
const emailService = require('../services/emailService');

// @desc    Create a new supervision request
// @route   POST /api/supervision-requests
// @access  Private (Student only)
const createSupervisionRequest = async (req, res) => {
  try {
    const { supervisorId } = req.body;
    const studentId = req.user.id;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor ID is required'
      });
    }

    // Find student info - handle both User and Student models
    let student;
    
    console.log('🔍 Looking for student with user ID:', studentId, 'and email:', req.user.email);
    
    // First try to find by email in Student collection
    student = await Student.findOne({ email: req.user.email });
    console.log('📧 Student found by email:', student ? 'YES' : 'NO');
    
    // If not found by email, try to find by user ID
    if (!student) {
      student = await Student.findById(studentId);
      console.log('🆔 Student found by ID:', student ? 'YES' : 'NO');
    }
    
    if (student) {
      console.log('✅ Student data found:');
      console.log('- Name:', student.fullName);
      console.log('- Email:', student.email);
      console.log('- Roll Number:', student.rollNumber);
      console.log('- Department:', student.department);
      console.log('- Semester:', student.semester);
      console.log('- CGPA:', student.cgpa);
      console.log('- Phone:', student.phoneNumber);
    }
    
    // If still not found, check if user has student role but no profile yet
    if (!student && req.user.role === 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your profile first.'
      });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find supervisor info
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    // Check if student already has ANY active pending request (to any supervisor)
    const anyPendingRequest = await SupervisionRequest.findOne({
      studentId: student._id,
      status: 'pending'
    });

    if (anyPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending supervision request. Please wait for a response before sending another request.'
      });
    }

    // Check if student already has an accepted request (assigned supervisor)
    const acceptedRequest = await SupervisionRequest.findOne({
      studentId: student._id,
      status: 'accepted'
    });

    if (acceptedRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an assigned supervisor.'
      });
    }

    // Check if supervisor has reached maximum student limit
    const acceptedRequestsCount = await SupervisionRequest.countDocuments({
      supervisorId: supervisorId,
      status: 'accepted'
    });

    const supervisorMaxStudents = supervisor.supervisor?.maxStudents || supervisor.maxStudents || 5;

    if (acceptedRequestsCount >= supervisorMaxStudents) {
      return res.status(400).json({
        success: false,
        message: 'This supervisor has reached their maximum student capacity.'
      });
    }

    // Create the supervision request with proper data extraction
    const supervisionRequestData = {
      studentId: student._id,
      studentName: student.fullName,
      studentEmail: student.email,
      studentRollNumber: student.rollNumber || 'N/A',
      studentDepartment: student.department || 'N/A',
      studentSemester: student.semester || 'N/A',
      studentCGPA: student.cgpa ? student.cgpa.toString() : 'N/A',
      studentPhoneNumber: student.phoneNumber || 'N/A',
      supervisorId: supervisorId,
      supervisorName: supervisor.name,
      status: 'pending'
    };
    
    console.log('📋 Creating supervision request with data:', supervisionRequestData);
    
    const supervisionRequest = new SupervisionRequest(supervisionRequestData);

    await supervisionRequest.save();

    // Create notification for supervisor
    try {
      await Notification.createSupervisorNotification(
        supervisionRequest._id,
        supervisorId,
        student.fullName,
        student._id,
        'Please review the request details and respond accordingly.'
      );
      console.log('✅ Supervisor notification created successfully');
    } catch (notifError) {
      console.error('⚠️ Error creating supervisor notification:', notifError);
      // Don't fail the request creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Supervision request sent successfully',
      data: supervisionRequest
    });

  } catch (error) {
    console.error('Error creating supervision request:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You already have a request to this supervisor'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating supervision request',
      error: error.message
    });
  }
};

// @desc    Get student's supervision requests
// @route   GET /api/supervision-requests/student
// @access  Private (Student only)
const getStudentSupervisionRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student - handle both User and Student models
    let student;
    
    // First try to find by email in Student collection
    student = await Student.findOne({ email: req.user.email });
    
    // If not found by email, try to find by user ID
    if (!student) {
      student = await Student.findById(studentId);
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const requests = await SupervisionRequest.find({
      studentId: student._id
    })
    .populate('supervisorId', 'name email supervisor')
    .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching student supervision requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supervision requests',
      error: error.message
    });
  }
};

// @desc    Get supervisor's supervision requests (all statuses)
// @route   GET /api/supervision-requests/supervisor
// @access  Private (Supervisor only)
const getSupervisorSupervisionRequests = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { status } = req.query; // Allow optional status filter

    // Build query - if status is provided, filter by it, otherwise get all
    const query = { supervisorId: supervisorId };
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await SupervisionRequest.find(query)
    .populate('studentId', 'fullName email department semester cgpa phoneNumber rollNumber')
    .sort({ requestedAt: -1 });

    // Enhance requests with additional student data if available
    const enhancedRequests = requests.map(request => {
      const requestObj = request.toObject();
      
      // If student data is populated from the Student model, use that
      if (request.studentId && typeof request.studentId === 'object') {
        requestObj.studentData = {
          fullName: request.studentId.fullName || requestObj.studentName,
          email: request.studentId.email || requestObj.studentEmail,
          rollNumber: request.studentId.rollNumber || requestObj.studentRollNumber,
          department: request.studentId.department || requestObj.studentDepartment,
          semester: request.studentId.semester || requestObj.studentSemester,
          cgpa: request.studentId.cgpa || requestObj.studentCGPA,
          phoneNumber: request.studentId.phoneNumber || requestObj.studentPhoneNumber
        };
      } else {
        // Use the stored data in the request itself
        requestObj.studentData = {
          fullName: requestObj.studentName,
          email: requestObj.studentEmail,
          rollNumber: requestObj.studentRollNumber,
          department: requestObj.studentDepartment,
          semester: requestObj.studentSemester,
          cgpa: requestObj.studentCGPA,
          phoneNumber: requestObj.studentPhoneNumber
        };
      }
      
      return requestObj;
    });

    res.status(200).json({
      success: true,
      data: enhancedRequests,
      count: enhancedRequests.length,
      stats: {
        total: enhancedRequests.length,
        pending: enhancedRequests.filter(r => r.status === 'pending').length,
        accepted: enhancedRequests.filter(r => r.status === 'accepted').length,
        rejected: enhancedRequests.filter(r => r.status === 'rejected').length
      }
    });

  } catch (error) {
    console.error('Error fetching supervisor supervision requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supervision requests',
      error: error.message
    });
  }
};

// @desc    Update supervision request status (Accept/Reject)
// @route   PATCH /api/supervision-requests/:requestId
// @access  Private (Supervisor only)
const updateSupervisionRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, supervisorComments } = req.body;
    const supervisorId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }

    // Find the request
    const request = await SupervisionRequest.findOne({
      _id: requestId,
      supervisorId: supervisorId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Supervision request not found or already processed'
      });
    }

    // If accepting, check if supervisor has capacity
    if (status === 'accepted') {
      const supervisor = await User.findById(supervisorId);
      const acceptedRequestsCount = await SupervisionRequest.countDocuments({
        supervisorId: supervisorId,
        status: 'accepted'
      });

      const supervisorMaxStudents = supervisor.supervisor?.maxStudents || supervisor.maxStudents || 5;

      if (acceptedRequestsCount >= supervisorMaxStudents) {
        return res.status(400).json({
          success: false,
          message: 'You have reached your maximum student capacity. Please update your capacity in Edit Profile if needed.'
        });
      }

      // Reject all other pending requests from this student
      await SupervisionRequest.updateMany(
        {
          studentId: request.studentId,
          status: 'pending',
          _id: { $ne: requestId }
        },
        {
          status: 'rejected',
          respondedAt: new Date(),
          supervisorComments: 'Auto-rejected: Student accepted by another supervisor'
        }
      );
    }

    // Update the request
    request.status = status;
    request.respondedAt = new Date();
    if (supervisorComments) {
      request.supervisorComments = supervisorComments;
    }

    await request.save();

    // If accepted, update the student's selectedSupervisorId
    if (status === 'accepted') {
      await Student.findByIdAndUpdate(
        request.studentId,
        { selectedSupervisorId: supervisorId }
      );

      // Send supervisor acceptance email
      try {
        console.log('📧 Sending supervisor acceptance email...');
        
        // Get student and supervisor details for email
        const student = await Student.findById(request.studentId);
        const supervisor = await User.findById(supervisorId).select('name email department phone');
        
        if (student && supervisor) {
          // Find the student's user account for email
          const studentUser = await User.findOne({ email: student.email });
          
          if (studentUser) {
            // Prepare supervisor information for email
            const supervisorInfo = {
              name: supervisor.name,
              email: supervisor.email,
              department: supervisor.department || 'Computer Science',
              phone: supervisor.phone || 'Contact via email',
              officeLocation: supervisor.officeLocation || 'Faculty Office'
            };

            await emailService.sendSupervisorAcceptedEmail(studentUser, supervisorInfo);
            console.log('✅ Supervisor acceptance email sent successfully to:', studentUser.email);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending supervisor acceptance email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Create notification for the student
    try {
      // Get student and supervisor information for notification
      const student = await Student.findById(request.studentId);
      const supervisor = await User.findById(supervisorId);
      
      if (student && supervisor) {
        // Find the student's user account
        const studentUser = await User.findOne({ email: student.email });
        
        if (studentUser) {
          await createSupervisionRequestNotification(
            studentUser._id,
            request.studentId,
            supervisor.name,
            supervisorId,
            status,
            supervisorComments
          );
          
          console.log(`📧 Notification sent to student ${student.fullName} for supervision request ${status}`);
        }
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Supervision request ${status} successfully`,
      data: request
    });

  } catch (error) {
    console.error('Error updating supervision request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating supervision request',
      error: error.message
    });
  }
};

module.exports = {
  createSupervisionRequest,
  getStudentSupervisionRequests,
  getSupervisorSupervisionRequests,
  updateSupervisionRequestStatus
};
