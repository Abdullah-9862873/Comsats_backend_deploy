const express = require('express');
const router = express.Router();
const {
  createNotification,
  getStudentNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} = require('../controllers/notificationController');
const { auth, hasRole } = require('../middleware/auth');

// Helper middleware to allow both students and supervisors
const allowStudentOrSupervisor = (req, res, next) => {
  if (req.user && (req.user.role === 'student' || req.user.role === 'supervisor')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Required role: student or supervisor'
    });
  }
};

// @route   POST /api/notifications
// @desc    Create a new notification (System/Admin only)
// @access  Private (Admin/System)
router.post('/', auth, hasRole('admin'), createNotification);

// @route   GET /api/notifications/student
// @desc    Get all notifications for the authenticated user (student or supervisor)
// @access  Private (Student or Supervisor)
router.get('/student', auth, allowStudentOrSupervisor, getStudentNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count for user
// @access  Private (Student or Supervisor)
router.get('/unread-count', auth, allowStudentOrSupervisor, getUnreadNotificationCount);

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private (Student or Supervisor - own notifications)
router.get('/:id', auth, allowStudentOrSupervisor, getNotificationById);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Student or Supervisor - own notifications)
router.patch('/:id/read', auth, allowStudentOrSupervisor, markNotificationAsRead);

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read for the authenticated user
// @access  Private (Student or Supervisor)
router.patch('/mark-all-read', auth, allowStudentOrSupervisor, markAllNotificationsAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private (Student or Supervisor - own notifications)
router.delete('/:id', auth, allowStudentOrSupervisor, deleteNotification);

module.exports = router;
