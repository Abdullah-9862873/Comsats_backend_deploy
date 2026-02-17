const express = require('express');
const router = express.Router();
const { unifiedAuth } = require('../middleware/unifiedAuth');
const {
  getStudentChat,
  sendMessageToSupervisor,
  markSupervisorMessagesAsRead,
  exportStudentChatPDF,
  downloadAttachment,
  getUnreadCount,
  markSupervisorMessagesAsReadByEmail
} = require('../controllers/studentChatController');
const { upload } = require('../middleware/upload');

// Get student's chat with supervisor
router.get('/chat', unifiedAuth(['student']), getStudentChat);

// Send message to supervisor
router.post('/message', unifiedAuth(['student']), sendMessageToSupervisor);

// Mark supervisor messages as read
router.put('/read', unifiedAuth(['student']), markSupervisorMessagesAsRead);

// Export chat as PDF
router.get('/export', unifiedAuth(['student']), exportStudentChatPDF);

// Send message with file attachments
router.post('/message-with-files', unifiedAuth(['student']), upload.array('attachments', 5), sendMessageToSupervisor);

// Download chat attachment
router.get('/download/:filename', unifiedAuth(['student']), downloadAttachment);

// Get unread message count
router.post('/unread-count', getUnreadCount);

// Mark supervisor messages as read by email
router.post('/mark-supervisor-read', markSupervisorMessagesAsReadByEmail);

module.exports = router;