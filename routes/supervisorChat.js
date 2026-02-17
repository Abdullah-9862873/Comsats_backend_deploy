const express = require('express');
const router = express.Router();
const { unifiedAuth } = require('../middleware/unifiedAuth');
const {
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
} = require('../controllers/supervisorChatController');
const { upload } = require('../middleware/upload');

// Get all supervised students
router.get('/students', unifiedAuth(['supervisor']), getSupervisedStudents);

// Get chat history with a specific student
router.get('/chat/:studentId', unifiedAuth(['supervisor']), getChatHistory);

// Send a message to a student
router.post('/chat/:studentId/message', unifiedAuth(['supervisor']), sendMessage);

// Mark messages as read
router.put('/chat/:studentId/read', unifiedAuth(['supervisor']), markMessagesAsRead);

// Send progress update to student
router.post('/chat/:studentId/progress', unifiedAuth(['supervisor']), sendProgressUpdate);

// Get unread message counts
router.get('/unread-counts', unifiedAuth(['supervisor']), getUnreadCounts);

// Export chat as PDF
router.get('/chat/:studentId/export', unifiedAuth(['supervisor']), exportChatPDF);

// Send message with file attachments
router.post('/chat/:studentId/message-with-files', unifiedAuth(['supervisor']), upload.array('attachments', 5), sendMessage);

// Download chat attachment
router.get('/download/:filename', unifiedAuth(['supervisor']), downloadAttachment);

// Get total unread message count
router.post('/unread-count', unifiedAuth(['supervisor']), getUnreadCount);

// Mark all student messages as read
router.post('/mark-all-read', unifiedAuth(['supervisor']), markAllStudentMessagesAsRead);

module.exports = router;