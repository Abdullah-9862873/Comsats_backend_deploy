const SupervisorChat = require('../models/SupervisorChat');
const Student = require('../models/Student');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get student's chat with supervisor
const getStudentChat = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }
    
    // Try to find in Student model first
    let student = await Student.findById(userId).populate('selectedSupervisorId', 'name email');
    let supervisorId = null;
    let actualStudentId = userId;
    
    if (student && student.selectedSupervisorId) {
      supervisorId = student.selectedSupervisorId._id;
      actualStudentId = student._id;
    } else {
      // Try to find in User model
      const user = await User.findById(userId);
      if (!user || user.role !== 'student') {
        return res.status(401).json({ success: false, message: 'Invalid token. Student not found.' });
      }
      
      // Look for corresponding Student record by email
      const studentByEmail = await Student.findOne({ 
        email: { $regex: new RegExp('^' + user.email + '$', 'i') }
      }).populate('selectedSupervisorId', 'name email');
      
      if (studentByEmail && studentByEmail.selectedSupervisorId) {
        student = studentByEmail;
        supervisorId = studentByEmail.selectedSupervisorId._id;
        actualStudentId = studentByEmail._id;
      } else {
        // No supervisor assigned or no Student record found
        return res.json({ 
          success: true, 
          data: { 
            supervisor: null, 
            chat: null, 
            message: 'No supervisor assigned yet' 
          } 
        });
      }
    }
    
    // Get chat history
    let chat = await SupervisorChat.findOne({ 
      supervisorId: supervisorId, 
      studentId: actualStudentId 
    });
    
    if (!chat) {
      chat = { messages: [] };
    }
    
    res.json({ 
      success: true, 
      data: { 
        supervisor: student.selectedSupervisorId, 
        chat 
      } 
    });
  } catch (error) {
    console.error('Error fetching student chat:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat' });
  }
};

// Send message to supervisor
const sendMessageToSupervisor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    // Find student to get supervisor (similar logic to getStudentChat)
    let student = await Student.findById(userId);
    let actualStudentId = userId;
    
    if (!student) {
      // Try to find in User model and then look up Student by email
      const user = await User.findById(userId);
      if (!user || user.role !== 'student') {
        return res.status(401).json({ success: false, message: 'Invalid token. Student not found.' });
      }
      
      const studentByEmail = await Student.findOne({ 
        email: { $regex: new RegExp('^' + user.email + '$', 'i') }
      });
      
      if (studentByEmail) {
        student = studentByEmail;
        actualStudentId = studentByEmail._id;
      }
    }
    
    if (!student || !student.selectedSupervisorId) {
      return res.status(400).json({ success: false, message: 'No supervisor assigned' });
    }
    
    let chat = await SupervisorChat.findOne({ 
      supervisorId: student.selectedSupervisorId, 
      studentId: actualStudentId 
    });
    
    if (!chat) {
      chat = new SupervisorChat({
        supervisorId: student.selectedSupervisorId,
        studentId: actualStudentId,
        messages: []
      });
    }
    
    const newMessage = {
      senderId: actualStudentId,
      senderType: 'student',
      message: message.trim(),
      attachments: [],
      timestamp: new Date(),
      isRead: false
    };
    
    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      newMessage.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        isReport: false
      }));
    }
    
    chat.messages.push(newMessage);
    chat.lastActivity = new Date();
    await chat.save();
    
    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Mark supervisor messages as read
const markSupervisorMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    // Find the corresponding Student record using email (case-insensitive)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${user.email}$`, 'i') }
    });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    
    const actualStudentId = student._id;
    
    const chat = await SupervisorChat.findOne({ 
      studentId: actualStudentId 
    });
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    // Mark all supervisor messages as read
    chat.messages.forEach(message => {
      if (message.senderType === 'supervisor') {
        message.isRead = true;
      }
    });
    
    await chat.save();
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Export chat as PDF
const exportStudentChatPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find student to get supervisor
    const student = await Student.findById(userId);
    
    if (!student || !student.selectedSupervisorId) {
      return res.status(400).json({ success: false, message: 'No supervisor assigned' });
    }
    
    const chat = await SupervisorChat.findOne({ 
      supervisorId: student.selectedSupervisorId, 
      studentId: userId 
    }).populate('supervisorId', 'name email');
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    // Generate PDF content
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="supervisor-chat-${Date.now()}.pdf"`);
    
    doc.pipe(res);
    
    // PDF Header
    doc.fontSize(20).text('Supervisor Chat Transcript', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12)
       .text(`Supervisor: ${chat.supervisorId?.name || 'Unknown'}`)
       .text(`Student: ${student.fullName || 'Unknown'}`)
       .text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();
    
    // Messages
    chat.messages.forEach((message, index) => {
      const sender = message.senderType === 'supervisor' ? 'Supervisor' : 'Student';
      const timestamp = new Date(message.timestamp).toLocaleString();
      
      doc.fontSize(10).fillColor('gray').text(`${sender} - ${timestamp}`);
      doc.fontSize(11).fillColor('black').text(message.message, { indent: 20 });
      
      if (message.attachments && message.attachments.length > 0) {
        doc.fontSize(9).fillColor('blue').text('Attachments:', { indent: 20 });
        message.attachments.forEach(att => {
          doc.text(`- ${att.originalName}`, { indent: 40 });
        });
      }
      
      doc.moveDown(0.5);
    });
    
    doc.end();
  } catch (error) {
    console.error('Error exporting chat PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to export chat' });
  }
};

// Download chat attachment
const downloadAttachment = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/chat-attachments', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};

// Get unread message count for student
const getUnreadCount = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find student by email
    const student = await Student.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') }
    }).populate('selectedSupervisorId');

    if (!student || !student.selectedSupervisorId) {
      return res.json({ success: true, unreadCount: 0 });
    }

    // Find chat between student and supervisor
    const chat = await SupervisorChat.findOne({
      studentId: student._id,
      supervisorId: student.selectedSupervisorId._id
    });

    if (!chat || !chat.messages || chat.messages.length === 0) {
      return res.json({ success: true, unreadCount: 0 });
    }

    // Count unread messages from supervisor using isRead field
    let unreadCount = 0;

    chat.messages.forEach(message => {
      if (message.senderType === 'supervisor' && !message.isRead) {
        unreadCount++;
      }
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Mark supervisor messages as read for student
const markSupervisorMessagesAsReadByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find student by email
    const student = await Student.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') }
    }).populate('selectedSupervisorId');

    if (!student || !student.selectedSupervisorId) {
      return res.json({ success: true, message: 'No supervisor assigned' });
    }

    // Mark all supervisor messages as read
    await SupervisorChat.updateOne(
      { 
        studentId: student._id,
        supervisorId: student.selectedSupervisorId._id
      },
      { 
        $set: { 
          'messages.$[elem].isRead': true 
        } 
      },
      { 
        arrayFilters: [{ 
          'elem.senderType': 'supervisor', 
          'elem.isRead': false 
        }] 
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking supervisor messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudentChat,
  sendMessageToSupervisor,
  markSupervisorMessagesAsRead,
  exportStudentChatPDF,
  downloadAttachment,
  getUnreadCount,
  markSupervisorMessagesAsReadByEmail
};