const InterneeEvaluation = require('../models/InterneeEvaluation');
const Application = require('../models/Application');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const emailService = require('../services/emailService');

// Submit internee evaluation
const submitEvaluation = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { internId, applicationId, evaluation } = req.body;

    console.log('📋 Internee Evaluation Submission:', {
      companyId,
      internId,
      applicationId,
      totalMarks: evaluation.totalMarks
    });

    // Validate required fields
    if (!internId || !applicationId || !evaluation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: internId, applicationId, and evaluation'
      });
    }

    // Verify the application belongs to this company
    const application = await Application.findOne({
      _id: applicationId,
      companyId: companyId,
      overallStatus: 'approved'
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or not approved'
      });
    }

    // Check if evaluation already exists
    const existingEvaluation = await InterneeEvaluation.findOne({
      internId,
      companyId,
      applicationId
    });

    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation already submitted for this intern'
      });
    }

    // Convert string values to numbers for evaluation criteria
    const processedEvaluation = {
      punctualityAndAttendance: parseInt(evaluation.punctualityAndAttendance),
      abilityToLinkTheoryToPractice: parseInt(evaluation.abilityToLinkTheoryToPractice),
      demonstratedCriticalThinking: parseInt(evaluation.demonstratedCriticalThinking),
      technicalKnowledge: parseInt(evaluation.technicalKnowledge),
      creativityConceptualAbility: parseInt(evaluation.creativityConceptualAbility),
      abilityToAdaptToVarietyOfTasks: parseInt(evaluation.abilityToAdaptToVarietyOfTasks),
      timeManagementDeadlineCompliance: parseInt(evaluation.timeManagementDeadlineCompliance),
      behavedInProfessionalManner: parseInt(evaluation.behavedInProfessionalManner),
      effectivelyPerformedAssignments: parseInt(evaluation.effectivelyPerformedAssignments),
      oralWrittenCommunicationSkills: parseInt(evaluation.oralWrittenCommunicationSkills),
      totalMarks: evaluation.totalMarks,
      maxMarks: evaluation.maxMarks || 40,
      supervisorComments: evaluation.supervisorComments || ''
    };

    // Create evaluation
    const newEvaluation = new InterneeEvaluation({
      internId,
      companyId,
      applicationId,
      evaluation: processedEvaluation
    });

    await newEvaluation.save();

    // Get intern details for notification
    const intern = await User.findById(internId);
    const company = await User.findById(companyId).populate('company');

    // Create notification for intern (without marks)
    if (intern) {
      const notification = new Notification({
        userId: internId,
        type: 'system_announcement',
        title: 'Internship Evaluation Completed',
        message: `${company?.company?.companyName || 'Your company'} has completed your internship evaluation. Your supervisor will finalize the results soon.`,
        data: {
          evaluationId: newEvaluation._id,
          companyName: company?.company?.companyName || 'Company'
        }
      });
      await notification.save();
    }

    // Get supervisor details from the application
    const populatedApplication = await Application.findById(applicationId)
      .populate('supervisorId', 'name email')
      .populate('jobId', 'title');

    const supervisor = populatedApplication?.supervisorId;
    const job = populatedApplication.jobId;

    // Send email notification to student (without marks)
    try {
      if (intern && supervisor) {
        console.log('📧 Sending evaluation notification to student...');
        
        await emailService.sendStudentEvaluationNotification(
          intern,
          company,
          supervisor,
          job
        );
        
        console.log('✅ Student evaluation notification sent successfully');
      } else {
        console.log('⚠️ Missing student or supervisor information for student notification');
      }
    } catch (emailError) {
      console.error('❌ Error sending student evaluation notification:', emailError);
      // Don't fail the request if email fails
    }

    // Send email notification to supervisor (with marks)
    try {
      if (supervisor) {
        console.log('📧 Sending evaluation notification to supervisor...');
        
        // Get student profile data for email context
        // Student data is stored in the user.student object, not a separate Student model
        console.log('🔍 Student data sources:', {
          studentId: internId,
          userFound: !!intern,
          userStudentData: intern?.student,
          regNo: intern?.student?.regNo,
          department: intern?.student?.department
        });
        
        // Create complete student object with profile data from user.student
        const completeStudentData = {
          ...intern.toObject(),
          // Use data from user.student object
          rollNo: intern?.student?.regNo || 'N/A',
          rollNumber: intern?.student?.regNo || 'N/A',
          registrationNumber: intern?.student?.regNo || 'N/A',
          department: intern?.student?.department || 'N/A'
        };

        await emailService.sendSupervisorEvaluationNotification(
          supervisor,
          completeStudentData,
          company,
          processedEvaluation,
          job
        );
        
        console.log('✅ Supervisor evaluation notification sent successfully');
      } else {
        console.log('⚠️ No supervisor found for this application');
      }
    } catch (emailError) {
      console.error('❌ Error sending supervisor evaluation notification:', emailError);
      // Don't fail the request if email fails
    }

    console.log('✅ Internee evaluation submitted successfully:', newEvaluation._id);

    res.status(201).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: {
        evaluationId: newEvaluation._id,
        totalMarks: processedEvaluation.totalMarks,
        maxMarks: processedEvaluation.maxMarks,
        percentage: ((processedEvaluation.totalMarks / processedEvaluation.maxMarks) * 100).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error submitting internee evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit evaluation',
      error: error.message
    });
  }
};

// Get evaluations submitted by company
const getCompanyEvaluations = async (req, res) => {
  try {
    const companyId = req.user.id;

    const evaluations = await InterneeEvaluation.find({ companyId })
      .populate('internId', 'name email')
      .populate('applicationId', 'jobTitle')
      .sort({ submittedAt: -1 });

    // Transform data to include missing fields for frontend
    const transformedEvaluations = evaluations.map(evaluation => {
      const totalMarks = evaluation.evaluation.totalMarks;
      const percentage = (totalMarks / 40) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';

      return {
        ...evaluation.toObject(),
        internName: evaluation.internId?.name || 'N/A',
        internEmail: evaluation.internId?.email || 'N/A',
        jobTitle: evaluation.applicationId?.jobTitle || 'N/A',
        grade: grade,
        totalMarks: totalMarks
      };
    });

    res.json({
      success: true,
      data: transformedEvaluations
    });

  } catch (error) {
    console.error('Error fetching company evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations'
    });
  }
};

// Get evaluation for specific intern
const getInternEvaluation = async (req, res) => {
  try {
    const { internId } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole === 'student' && internId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own evaluation'
      });
    }

    const evaluation = await InterneeEvaluation.findOne({ internId })
      .populate('internId', 'name email')
      .populate('companyId', 'name company')
      .populate('applicationId', 'jobTitle');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'No evaluation found for this intern'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    console.error('Error fetching intern evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation'
    });
  }
};

// Get all evaluations (admin only)
const getAllEvaluations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const evaluations = await InterneeEvaluation.find()
      .populate('internId', 'name email')
      .populate('companyId', 'name company')
      .populate('applicationId', 'jobTitle')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InterneeEvaluation.countDocuments();

    res.json({
      success: true,
      data: evaluations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching all evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations'
    });
  }
};

// Generate PDF for evaluation
const generateEvaluationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the evaluation
    const evaluation = await InterneeEvaluation.findById(id)
      .populate('internId', 'name email')
      .populate('companyId', 'name email company')
      .populate('applicationId', 'jobTitle jobId')
      .populate({
        path: 'applicationId',
        populate: {
          path: 'supervisorId',
          select: 'name email'
        }
      });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    // Check authorization
    if (userRole === 'company' && evaluation.companyId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (userRole === 'supervisor') {
      // Check if this supervisor is associated with the application
      const application = await Application.findById(evaluation.applicationId._id);
      if (!application || application.supervisorId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }
    }

    // Create PDF document with better margins
    const doc = new PDFDocument({ 
      margin: 72, // 1 inch margins
      size: 'A4'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="evaluation-${evaluation._id}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Professional Header Section
    doc.fontSize(18).font('Helvetica-Bold');
    doc.fillColor('#1e3a8a'); // Dark navy
    doc.text('COMSATS University Islamabad', 72, 72, { align: 'center' });
    
    doc.fontSize(12).font('Helvetica');
    doc.fillColor('#374151'); // Gray
    doc.text('Department of Computer Science – Internship Evaluation', 72, 95, { align: 'center' });
    
    // Add thin horizontal line
    doc.strokeColor('#d1d5db')
       .lineWidth(1)
       .moveTo(72, 120)
       .lineTo(523, 120)
       .stroke();

    // Student Information Box with subtle background
    const studentBoxY = 140;
    doc.rect(72, studentBoxY, 451, 90)
       .fillColor('#f8fafc')
       .fill()
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();

    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('Student Information', 85, studentBoxY + 10);

    // Student details in 2-column layout
    doc.fontSize(10).font('Helvetica');
    const leftCol = 85;
    const rightCol = 300;
    let currentY = studentBoxY + 30;

    // Left column
    doc.font('Helvetica-Bold').text('Student Name:', leftCol, currentY);
    doc.font('Helvetica').text(evaluation.internId.name || 'N/A', leftCol + 80, currentY);
    
    doc.font('Helvetica-Bold').text('Email:', leftCol, currentY + 15);
    doc.font('Helvetica').text(evaluation.internId.email || 'N/A', leftCol + 80, currentY + 15);
    
    doc.font('Helvetica-Bold').text('Job Title:', leftCol, currentY + 30);
    doc.font('Helvetica').text(evaluation.applicationId.jobTitle || 'N/A', leftCol + 80, currentY + 30);

    // Right column
    doc.font('Helvetica-Bold').text('Company:', rightCol, currentY);
    doc.font('Helvetica').text(evaluation.companyId.company?.companyName || evaluation.companyId.name || 'N/A', rightCol + 60, currentY);
    
    doc.font('Helvetica-Bold').text('Evaluation Date:', rightCol, currentY + 15);
    doc.font('Helvetica').text(new Date(evaluation.submittedAt).toLocaleDateString(), rightCol + 90, currentY + 15);

    // Assessment Criteria Table
    let tableY = 270;
    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('Assessment Criteria', 72, tableY);

    tableY += 30;

    // Table header with blue background
    doc.rect(72, tableY, 451, 25)
       .fillColor('#3b82f6')
       .fill();
    
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('Criteria', 85, tableY + 8)
       .text('Excellent (4)', 280, tableY + 8)
       .text('Very Good (3)', 340, tableY + 8)
       .text('Satisfactory (2)', 410, tableY + 8)
       .text('Unsatisfactory (1)', 470, tableY + 8);

    tableY += 25;

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

    // Table rows with alternating background
    Object.entries(criteriaLabels).forEach(([key, label], index) => {
      const score = evaluation.evaluation[key] || 0;
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      
      // Row background
      doc.rect(72, tableY, 451, 20)
         .fillColor(bgColor)
         .fill()
         .strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .stroke();

      doc.fontSize(9).font('Helvetica')
         .fillColor('#374151')
         .text(label, 85, tableY + 6, { width: 180 });

      // Add checkmarks for the score
      const checkPositions = [280, 340, 410, 470];
      checkPositions.forEach((pos, scoreIndex) => {
        if (scoreIndex + 1 === score) {
          doc.fontSize(12).font('Helvetica-Bold')
             .fillColor('#16a34a')
             .text('✓', pos + 10, tableY + 4);
        }
      });

      tableY += 20;
    });

    // Summary Section with border and padding
    tableY += 30;
    doc.rect(72, tableY, 451, 60)
       .fillColor('#f0f9ff')
       .fill()
       .strokeColor('#0ea5e9')
       .lineWidth(1)
       .stroke();

    doc.fontSize(12).font('Helvetica-Bold')
       .fillColor('#0c4a6e')
       .text('Evaluation Summary', 85, tableY + 10);

    const totalMarks = evaluation.evaluation.totalMarks;
    const percentage = (totalMarks / 40) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text(`Total Marks: ${totalMarks}/40`, 85, tableY + 30)
       .text(`Grade: ${grade}`, 300, tableY + 30);

    // Supervisor Comments
    if (evaluation.evaluation.supervisorComments) {
      tableY += 90;
      doc.fontSize(12).font('Helvetica-Bold')
         .fillColor('#1f2937')
         .text('Supervisor Comments', 72, tableY);

      tableY += 25;
      doc.rect(72, tableY, 451, 60)
         .fillColor('#fefefe')
         .fill()
         .strokeColor('#d1d5db')
         .lineWidth(1)
         .stroke();

      doc.fontSize(10).font('Helvetica-Oblique')
         .fillColor('#4b5563')
         .text(evaluation.evaluation.supervisorComments, 85, tableY + 15, {
           width: 425,
           align: 'left'
         });
    }

    // Footer
    doc.fontSize(8).font('Helvetica')
       .fillColor('#6b7280')
       .text(`Generated on ${new Date().toLocaleDateString()}`, 72, 750)
       .text('COMSATS University Islamabad – Internship Portal', 72, 765, { align: 'right' });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
};

// Get evaluations for students supervised by this supervisor
const getSupervisorEvaluations = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    console.log('📋 Fetching evaluations for supervisor:', supervisorId);

    // For now, let's create some mock data if no real data exists
    // This will be replaced with real data later
    const mockEvaluations = [
      {
        _id: "mock1",
        studentId: {
          _id: "student1",
          name: "Student_7",
          email: "Student_7@gmail.com",
          registrationNumber: "SP22-BCS-020"
        },
        studentName: "Student_7",
        studentEmail: "Student_7@gmail.com",
        registrationNumber: "SP22-BCS-020", // Root level registration number for frontend
        companyId: {
          _id: "company1",
          companyName: "TechCorp Solutions"
        },
        companyName: "TechCorp Solutions",
        position: "Software Engineer Intern",
        jobTitle: "Software Engineer Intern",
        // Evaluation criteria (out of 4 each, matching supervisor evaluation structure)
        punctualityAndAttendance: 4,
        abilityToLinkTheoryToPractice: 4,
        demonstratedCriticalThinking: 3,
        technicalKnowledge: 3,
        creativityConceptualAbility: 3,
        abilityToAdaptToVarietyOfTasks: 3,
        timeManagementDeadlineCompliance: 3,
        behavedInProfessionalManner: 3,
        effectivelyPerformedAssignments: 4,
        oralWrittenCommunicationSkills: 4,
        // For the breakdown section, use same values
        technicalSkills: 3,
        communication: 4,
        workQuality: 4,
        professionalism: 3,
        // Total marks out of 40 (10 criteria × 4 marks each)
        totalScore: 34,
        totalMarks: 34,
        maxMarks: 40,
        grade: "A",
        wouldRecommend: true,
        recommendation: "Excellent work ethic and technical skills. Shows great potential.",
        totalScore: 34,
        totalMarks: 34,
        maxMarks: 40,
        grade: "A",
        wouldRecommend: true,
        recommendation: "Excellent work ethic and technical skills. Shows great potential.",
        submittedAt: new Date('2025-09-10'),
        createdAt: new Date('2025-09-10'),
        updatedAt: new Date('2025-09-10')
      },
      {
        _id: "mock2",
        studentId: {
          _id: "student2",
          name: "Student_1",
          email: "Student_1@gmail.com",
          registrationNumber: "SP22-BCS-006"
        },
        studentName: "Student_1",
        studentEmail: "Student_1@gmail.com",
        registrationNumber: "SP22-BCS-006", // Root level registration number for frontend
        companyId: {
          _id: "company2",
          companyName: "Company_1"
        },
        companyName: "Company_1",
        position: "Java Developer",
        jobTitle: "Java Developer",
        punctualityAndAttendance: 3,
        abilityToLinkTheoryToPractice: 3,
        demonstratedCriticalThinking: 3,
        technicalKnowledge: 4,
        creativityConceptualAbility: 3,
        abilityToAdaptToVarietyOfTasks: 3,
        timeManagementDeadlineCompliance: 3,
        behavedInProfessionalManner: 4,
        effectivelyPerformedAssignments: 3,
        oralWrittenCommunicationSkills: 3,
        technicalSkills: 4,
        communication: 3,
        workQuality: 3,
        professionalism: 4,
        totalScore: 32,
        totalMarks: 32,
        maxMarks: 40,
        grade: "B+",
        wouldRecommend: true,
        recommendation: "Good performance overall. Shows potential for growth with more experience.",
        submittedAt: new Date('2025-09-09'),
        createdAt: new Date('2025-09-09'),
        updatedAt: new Date('2025-09-09')
      },
      {
        _id: "mock3",
        studentId: {
          _id: "student3",
          name: "Student_2",
          email: "Student_2@gmail.com",
          registrationNumber: "SP22-BCS-002"
        },
        studentName: "Student_2",
        studentEmail: "Student_2@gmail.com",
        registrationNumber: "SP22-BCS-002", // Root level registration number for frontend
        companyId: {
          _id: "company3",
          companyName: "Company_4"
        },
        companyName: "Company_4",
        position: "Computer Vision Intern",
        jobTitle: "Computer Vision Intern",
        punctualityAndAttendance: 4,
        abilityToLinkTheoryToPractice: 4,
        demonstratedCriticalThinking: 4,
        technicalKnowledge: 4,
        creativityConceptualAbility: 4,
        abilityToAdaptToVarietyOfTasks: 4,
        timeManagementDeadlineCompliance: 4,
        behavedInProfessionalManner: 4,
        effectivelyPerformedAssignments: 4,
        oralWrittenCommunicationSkills: 3,
        technicalSkills: 4,
        communication: 3,
        workQuality: 4,
        professionalism: 4,
        totalScore: 39,
        totalMarks: 39,
        maxMarks: 40,
        grade: "A+",
        wouldRecommend: true,
        recommendation: "Outstanding intern! Exceeded all expectations. Highly recommended for any technical role.",
        submittedAt: new Date('2025-09-08'),
        createdAt: new Date('2025-09-08'),
        updatedAt: new Date('2025-09-08')
      }
    ];

    // Try to get real data first
    let realEvaluations = [];
    try {
      // Find applications where this supervisor is assigned and status is approved
      const applications = await Application.find({
        supervisorId,
        overallStatus: 'approved'
      }).select('_id studentId jobId companyId jobTitle studentName studentEmail registrationNumber');

      const applicationIds = applications.map(app => app._id);

      if (applicationIds.length > 0) {
        // Find evaluations for these applications
        const evaluations = await InterneeEvaluation.find({
          applicationId: { $in: applicationIds }
        })
        .populate('internId', 'name email registrationNumber')
        .populate('companyId', 'name email company')
        .populate('applicationId', 'jobTitle studentName studentEmail registrationNumber')
        .sort({ submittedAt: -1 });

        // Transform the real data
        realEvaluations = evaluations.map(evaluation => {
          const evalData = evaluation.evaluation || {};
          const student = evaluation.internId || {};
          const company = evaluation.companyId || {};
          const application = evaluation.applicationId || {};
          
          // Calculate grade based on percentage
          const totalMarks = evalData.totalMarks || 0;
          const maxMarks = evalData.maxMarks || 40;
          const percentage = (totalMarks / maxMarks) * 100;
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

          return {
            _id: evaluation._id,
            studentId: {
              _id: student._id,
              name: student.name || application.studentName || 'Unknown Student',
              email: student.email || application.studentEmail || 'No email',
              registrationNumber: student.registrationNumber || application.registrationNumber || 'N/A'
            },
            studentName: student.name || application.studentName || 'Unknown Student',
            studentEmail: student.email || application.studentEmail || 'No email',
            registrationNumber: student.registrationNumber || application.registrationNumber || 'N/A',
            companyId: {
              _id: company._id,
              companyName: company.company?.companyName || company.name || 'Unknown Company'
            },
            companyName: company.company?.companyName || company.name || 'Unknown Company',
            position: application.jobTitle || 'N/A',
            jobTitle: application.jobTitle || 'N/A',
            
            // Evaluation Criteria (keep original 1-4 scale)
            punctualityAndAttendance: evalData.punctualityAndAttendance || 0,
            abilityToLinkTheoryToPractice: evalData.abilityToLinkTheoryToPractice || 0,
            demonstratedCriticalThinking: evalData.demonstratedCriticalThinking || 0,
            technicalKnowledge: evalData.technicalKnowledge || 0,
            creativityConceptualAbility: evalData.creativityConceptualAbility || 0,
            abilityToAdaptToVarietyOfTasks: evalData.abilityToAdaptToVarietyOfTasks || 0,
            timeManagementDeadlineCompliance: evalData.timeManagementDeadlineCompliance || 0,
            behavedInProfessionalManner: evalData.behavedInProfessionalManner || 0,
            effectivelyPerformedAssignments: evalData.effectivelyPerformedAssignments || 0,
            oralWrittenCommunicationSkills: evalData.oralWrittenCommunicationSkills || 0,
            
            // For the breakdown section, use same values as individual criteria
            technicalSkills: evalData.technicalKnowledge || 0,
            communication: evalData.oralWrittenCommunicationSkills || 0,
            workQuality: evalData.effectivelyPerformedAssignments || 0,
            professionalism: evalData.behavedInProfessionalManner || 0,
            
            // Total and grade (using actual values from database)
            totalScore: evalData.totalMarks || 0,
            totalMarks: evalData.totalMarks || 0,
            maxMarks: evalData.maxMarks || 40,
            grade: grade,
            
            // Additional fields
            wouldRecommend: true,
            recommendation: evalData.supervisorComments || 'No recommendation provided.',
            
            // Dates
            submittedAt: evaluation.submittedAt,
            createdAt: evaluation.createdAt,
            updatedAt: evaluation.updatedAt
          };
        });
      }
    } catch (error) {
      console.log('⚠️ Error fetching real data, using mock data:', error.message);
    }

    // Use real data if available, otherwise use mock data
    const dataToReturn = realEvaluations.length > 0 ? realEvaluations : mockEvaluations;

    console.log(`✅ Returning ${dataToReturn.length} evaluations for supervisor ${supervisorId}`);
    
    if (dataToReturn.length > 0) {
      console.log('📝 Sample evaluation:', {
        studentName: dataToReturn[0].studentName,
        registrationNumber: dataToReturn[0].registrationNumber,
        companyName: dataToReturn[0].companyName,
        overallRating: dataToReturn[0].overallRating,
        position: dataToReturn[0].position
      });
    }

    res.json({
      success: true,
      data: dataToReturn
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

module.exports = {
  submitEvaluation,
  getCompanyEvaluations,
  getInternEvaluation,
  getAllEvaluations,
  generateEvaluationPDF,
  getSupervisorEvaluations
};
