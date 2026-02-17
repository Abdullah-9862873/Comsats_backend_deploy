const Notification = require('../models/Notification');
const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private (System/Admin only - typically called internally)
const createNotification = async (req, res) => {
  try {
    const {
      userId,
      studentId,
      title,
      message,
      type,
      relatedEntityId,
      relatedEntityType,
      priority = 'medium',
      actionUrl,
      metadata = {},
      expiresAt
    } = req.body;

    // Validate required fields
    if (!userId || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, message, and type are required'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notification = new Notification({
      userId,
      studentId,
      title,
      message,
      type,
      relatedEntityId,
      relatedEntityType,
      priority,
      actionUrl,
      metadata,
      expiresAt
    });

    await notification.save();

    console.log(`📧 Notification created for user ${userId}: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notification',
      error: error.message
    });
  }
};

// @desc    Get all notifications for a student
// @route   GET /api/notifications/student
// @access  Private (Student only)
const getStudentNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, limit = 50, page = 1 } = req.query;

    console.log(`📱 Fetching notifications for user: ${userId}`);

    // Build query
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('studentId', 'fullName email rollNumber')
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      status: 'unread' 
    });

    console.log(`📋 Found ${notifications.length} notifications (${unreadCount} unread)`);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: error.message
    });
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private (Student only - own notifications)
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: id,
      userId: userId
    }).populate('studentId', 'fullName email rollNumber');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (Student only - own notifications)
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📖 Marking notification ${id} as read for user ${userId}`);

    const notification = await Notification.findOne({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Mark as read if not already read
    if (notification.status === 'unread') {
      await notification.markAsRead();
      console.log(`✅ Notification ${id} marked as read`);
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read for a user
// @route   PATCH /api/notifications/mark-all-read
// @access  Private (Student only)
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📖 Marking all notifications as read for user ${userId}`);

    const result = await Notification.updateMany(
      { userId: userId, status: 'unread' },
      { 
        status: 'read', 
        readAt: new Date() 
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: {
        updatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private (Student only - own notifications)
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    console.log(`🗑️ Notification ${id} deleted for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification',
      error: error.message
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private (Student only)
const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      userId: userId,
      status: 'unread'
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting unread count',
      error: error.message
    });
  }
};

// Helper function to create supervision request notification
const createSupervisionRequestNotification = async (
  studentUserId,
  studentId,
  supervisorName,
  supervisorId,
  status,
  comments = ''
) => {
  try {
    const notification = await Notification.createSupervisionNotification(
      studentUserId,
      studentId,
      supervisorName,
      supervisorId,
      status,
      comments
    );

    console.log(`📧 Supervision notification created: ${notification.title}`);
    return notification;
  } catch (error) {
    console.error('Error creating supervision notification:', error);
    throw error;
  }
};

// Helper function to create application notification
const createApplicationNotification = async (
  studentUserId,
  applicationId,
  status,
  supervisorName,
  jobTitle,
  companyName,
  comments = ''
) => {
  try {
    const notification = await Notification.createApplicationNotification(
      studentUserId,
      applicationId,
      status,
      supervisorName,
      jobTitle,
      companyName,
      comments
    );

    console.log(`📧 Application notification created: ${notification.title}`);
    return notification;
  } catch (error) {
    console.error('Error creating application notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getStudentNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  // Helper functions for other controllers
  createSupervisionRequestNotification,
  createApplicationNotification
};
