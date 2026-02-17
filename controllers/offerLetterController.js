const OfferLetter = require('../models/OfferLetter');
const Application = require('../models/Application');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Send offer letter to student
// @route   POST /api/offer-letters/send
// @access  Private (Company only)
const sendOfferLetter = async (req, res) => {
  try {
    console.log('=== OFFER LETTER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    // Validate required fields
    const { studentId, jobId, supervisorId, offerLetterContent, startDate, endDate, studentName, studentEmail, jobTitle } = req.body;
    
    const missingFields = [];
    if (!studentId) missingFields.push('studentId');
    if (!jobId) missingFields.push('jobId');
    if (!supervisorId) missingFields.push('supervisorId');
    if (!offerLetterContent) missingFields.push('offerLetterContent');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');
    if (!studentName) missingFields.push('studentName');
    if (!studentEmail) missingFields.push('studentEmail');
    if (!jobTitle) missingFields.push('jobTitle');
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        errors: missingFields.map(field => `${field} is required`)
      });
    }

    // Create offer letter with all required references
    const offerLetter = new OfferLetter({
      studentId,
      companyId: req.user.id,
      jobId,
      supervisorId,
      supervisorName: req.body.supervisorName || 'Assigned Supervisor',
      offerLetterContent,
      applicationId: req.body.applicationId,
      studentName,
      studentEmail,
      organizationName: req.body.organizationName || 'Organization Name',
      organizationAddress: req.body.organizationAddress || 'Organization Address',
      representativeName: req.body.representativeName || 'Representative Name',
      representativePosition: req.body.representativePosition || 'Representative Position',
      jobTitle,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      customMessage: req.body.customMessage || '',
      studentResponse: {
        response: 'pending',
        studentComments: '',
        respondedAt: null
      }
    });

    console.log('Saving offer letter...');
    console.log('Offer letter object before save:', JSON.stringify(offerLetter.toObject(), null, 2));
    
    await offerLetter.save();
    console.log('Offer letter saved successfully');

    res.status(201).json({
      success: true,
      message: 'Offer letter sent successfully',
      data: offerLetter
    });

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => {
        return `${key}: ${error.errors[key].message}`;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get company's sent offer letters
// @route   GET /api/offer-letters/company
// @access  Private (Company only)
const getCompanyOfferLetters = async (req, res) => {
  try {
    const offerLetters = await OfferLetter.find({ companyId: req.user.id })
      .populate('studentId', 'name email')
      .populate('applicationId', 'jobTitle appliedAt')
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: offerLetters
    });

  } catch (error) {
    console.error('Error fetching company offer letters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get student's received offer letters
// @route   GET /api/offer-letters/student
// @access  Private (Student only)
const getStudentOfferLetters = async (req, res) => {
  try {
    const offerLetters = await OfferLetter.find({ studentId: req.user.id })
      .populate('companyId', 'name email')
      .populate('applicationId', 'jobTitle appliedAt')
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      data: offerLetters
    });

  } catch (error) {
    console.error('Error fetching student offer letters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get supervisor's students' offer letters
// @route   GET /api/offer-letters/supervisor
// @access  Private (Supervisor only)
const getSupervisorOfferLetters = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    console.log('📋 Fetching offer letters for supervisor:', supervisorId);

    // CRITICAL FIX: Only fetch offer letters where this supervisor is assigned
    // Filter by supervisorId to ensure supervisor only sees their assigned students
    const offerLetters = await OfferLetter.find({
      supervisorId: supervisorId
    }).sort({ sentAt: -1 });

    console.log(`✅ Found ${offerLetters.length} offer letters for supervisor ${supervisorId}`);

    res.json({
      success: true,
      data: offerLetters
    });

  } catch (error) {
    console.error('Error fetching supervisor offer letters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Download offer letter as PDF
// @route   GET /api/offer-letters/:id/download
// @access  Private
const downloadOfferLetter = async (req, res) => {
  try {
    const offerLetter = await OfferLetter.findById(req.params.id);

    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found'
      });
    }

    // Check authorization
    if (offerLetter.studentId.toString() !== req.user.id && 
        offerLetter.companyId.toString() !== req.user.id) {
      // Check if user is supervisor of the student
      const application = await Application.findById(offerLetter.applicationId);
      if (!application || application.supervisorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to download this offer letter'
        });
      }
    }

    // Generate formatted content for download
    const formattedContent = `INTERNSHIP OFFER LETTER

${offerLetter.organizationName}
${offerLetter.organizationAddress}

Date: ${new Date(offerLetter.sentAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}

To,
Mr./Ms. ${offerLetter.studentName}
Email: ${offerLetter.studentEmail}

Subject: Internship Offer for the role of "${offerLetter.jobTitle}"

Dear ${offerLetter.studentName},

We are pleased to offer you the position of ${offerLetter.jobTitle} Intern at ${offerLetter.organizationName}.

Your internship will commence on ${new Date(offerLetter.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })} and conclude on ${new Date(offerLetter.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}.

This internship will be conducted under the supervision of ${offerLetter.supervisorName || 'Your Assigned Supervisor'}, who will guide you throughout your learning journey.

${offerLetter.customMessage ? `Additional Notes:
${offerLetter.customMessage}

` : ''}We look forward to your contribution and are excited to have you on board.

Sincerely,
${offerLetter.representativeName}
${offerLetter.representativePosition}
${offerLetter.organizationName}`;
    
    const filename = `offer-letter-${offerLetter.studentName.replace(/\s+/g, '-')}-${offerLetter.organizationName.replace(/\s+/g, '-')}.txt`;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(formattedContent);

  } catch (error) {
    console.error('Error downloading offer letter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get offer letter by ID
// @route   GET /api/offer-letters/:id
// @access  Private
const getOfferLetterById = async (req, res) => {
  try {
    const offerLetter = await OfferLetter.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('companyId', 'name email')
      .populate('applicationId', 'jobTitle appliedAt');

    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found'
      });
    }

    // Check if user is authorized to view this offer letter
    if (offerLetter.studentId._id.toString() !== req.user.id && 
        offerLetter.companyId._id.toString() !== req.user.id &&
        offerLetter.supervisorId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this offer letter'
      });
    }

    res.json({
      success: true,
      data: offerLetter
    });

  } catch (error) {
    console.error('Error fetching offer letter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Student respond to offer letter (accept/reject)
// @route   PATCH /api/offer-letters/:id/respond
// @access  Private (Student only)
const respondToOffer = async (req, res) => {
  try {
    const { response, studentComments } = req.body;

    if (!response || !['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Valid response (accepted/rejected) is required'
      });
    }

    const offerLetter = await OfferLetter.findById(req.params.id);
    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found'
      });
    }

    // Check if student is authorized to respond to this offer
    if (offerLetter.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this offer letter'
      });
    }

    // Check if already responded
    if (offerLetter.studentResponse.response) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this offer letter'
      });
    }

    // Update offer letter with student response
    offerLetter.studentResponse = {
      response,
      studentComments: studentComments || '',
      respondedAt: new Date()
    };
    offerLetter.status = response;

    await offerLetter.save();

    // Create notification for company
    const notification = new Notification({
      recipientId: offerLetter.companyId,
      recipientType: 'company',
      type: 'offer_response_received',
      title: `Offer Letter ${response === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: `${offerLetter.studentName} has ${response} your offer letter for the position of ${offerLetter.jobTitle}.`,
      data: {
        offerLetterId: offerLetter._id,
        applicationId: offerLetter.applicationId,
        studentName: offerLetter.studentName,
        jobTitle: offerLetter.jobTitle,
        response,
        studentComments
      }
    });

    await notification.save();

    res.json({
      success: true,
      message: `Offer letter ${response} successfully`,
      data: offerLetter
    });

  } catch (error) {
    console.error('Error responding to offer letter:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  sendOfferLetter,
  getCompanyOfferLetters,
  getStudentOfferLetters,
  getSupervisorOfferLetters,
  getOfferLetterById,
  downloadOfferLetter,
  respondToOffer
};