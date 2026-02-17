const SupervisorChat = require('../models/SupervisorChat');
const Student = require('../models/Student');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get all students supervised by the supervisor
const getSupervisedStudents = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    
    const students = await Student.find({ selectedSupervisorId: supervisorId })
      .select('fullName email rollNumber');
    
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching supervised students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

// Get chat history with a specific student
const getChatHistory = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { studentId } = req.params;
    
    let chat = await SupervisorChat.findOne({ supervisorId, studentId });
    
    if (!chat) {
      chat = new SupervisorChat({
        supervisorId,
        studentId,
        messages: []
      });
      await chat.save();
    }
    
    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

// Send a message to a student
const sendMessage = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { studentId } = req.params;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    let chat = await SupervisorChat.findOne({ supervisorId, studentId });
    
    if (!chat) {
      chat = new SupervisorChat({
        supervisorId,
        studentId,
        messages: []
      });
    }
    
    const newMessage = {
      senderId: supervisorId,
      senderType: 'supervisor',
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
        isReport: file.mimetype === 'application/pdf' && file.originalname.toLowerCase().includes('report')
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

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { studentId } = req.params;
    
    await SupervisorChat.updateOne(
      { supervisorId, studentId },
      { $set: { 'messages.$[elem].isRead': true } },
      { arrayFilters: [{ 'elem.senderType': 'student', 'elem.isRead': false }] }
    );
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
};

// Send progress update to student
const sendProgressUpdate = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { studentId } = req.params;
    const { title, description, priority } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }
    
    let chat = await SupervisorChat.findOne({ supervisorId, studentId });
    
    if (!chat) {
      chat = new SupervisorChat({
        supervisorId,
        studentId,
        messages: []
      });
    }
    
    const progressMessage = `📋 **Progress Update: ${title}**\n\n${description}\n\n*Priority: ${priority || 'Normal'}*`;
    
    chat.messages.push({
      senderId: supervisorId,
      senderType: 'supervisor',
      message: progressMessage,
      timestamp: new Date(),
      isRead: false
    });
    
    chat.lastActivity = new Date();
    await chat.save();
    
    res.json({ success: true, data: chat, message: 'Progress update sent successfully' });
  } catch (error) {
    console.error('Error sending progress update:', error);
    res.status(500).json({ success: false, message: 'Failed to send progress update' });
  }
};

// Get unread message counts for all supervised students
const getUnreadCounts = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    
    const chats = await SupervisorChat.find({ supervisorId });
    const unreadCounts = {};
    
    chats.forEach(chat => {
      const unreadCount = chat.messages.filter(msg => 
        msg.senderType === 'student' && !msg.isRead
      ).length;
      unreadCounts[chat.studentId.toString()] = unreadCount;
    });
    
    res.json({ success: true, data: unreadCounts });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread counts' });
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

// Export chat as PDF
const exportChatPDF = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { studentId } = req.params;
    
    const chat = await SupervisorChat.findOne({ supervisorId, studentId })
      .populate('supervisorId', 'name email')
      .populate('studentId', 'fullName email');
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    // Generate PDF content
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${studentId}-${Date.now()}.pdf"`);
    
    doc.pipe(res);
    
    // PDF Header
    doc.fontSize(20).text('Chat Transcript', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12)
       .text(`Supervisor: ${chat.supervisorId?.name || 'Unknown'}`)
       .text(`Student: ${chat.studentId?.fullName || 'Unknown'}`)
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

// Get total unread message count for supervisor
const getUnreadCount = async (req, res) => {
  try {
    // Try to get supervisor from authenticated user first
    let supervisorId;
    
    if (req.user && req.user.id) {
      // User is authenticated via unifiedAuth
      supervisorId = req.user.id;
    } else if (req.body.email) {
      // Fallback: Find supervisor by email from request body
      const supervisor = await User.findOne({ 
        email: { $regex: new RegExp('^' + req.body.email + '$', 'i') },
        role: 'supervisor'
      });

      if (!supervisor) {
        return res.json({ success: true, unreadCount: 0 });
      }
      supervisorId = supervisor._id;
    } else {
      return res.status(400).json({ success: false, message: 'Authentication required or email must be provided' });
    }

    // Find all chats with this supervisor
    const chats = await SupervisorChat.find({ supervisorId: supervisorId });

    if (!chats || chats.length === 0) {
      return res.json({ success: true, unreadCount: 0 });
    }

    // Count total unread messages from students using isRead field
    let totalUnreadCount = 0;

    chats.forEach(chat => {
      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(message => {
          if (message.senderType === 'student' && !message.isRead) {
            totalUnreadCount++;
          }
        });
      }
    });

    res.json({ success: true, unreadCount: totalUnreadCount });
  } catch (error) {
    console.error('Error getting supervisor unread count:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Mark all student messages as read for supervisor
const markAllStudentMessagesAsRead = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find supervisor by email
    const supervisor = await User.findOne({ 
      email: { $regex: new RegExp('^' + email + '$', 'i') },
      role: 'supervisor'
    });

    if (!supervisor) {
      return res.json({ success: true, message: 'Supervisor not found' });
    }

    // Mark all student messages as read across all chats
    await SupervisorChat.updateMany(
      { supervisorId: supervisor._id },
      { 
        $set: { 
          'messages.$[elem].isRead': true 
        } 
      },
      { 
        arrayFilters: [{ 
          'elem.senderType': 'student', 
          'elem.isRead': false 
        }] 
      }
    );

    res.json({ success: true, message: 'All student messages marked as read' });
  } catch (error) {
    console.error('Error marking all student messages as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSupervisedStudents,
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  sendProgressUpdate,
  getUnreadCounts,
  exportChatPDF,
  downloadAttachment,
  getUnreadCount,
  markAllStudentMessagesAsRead
};