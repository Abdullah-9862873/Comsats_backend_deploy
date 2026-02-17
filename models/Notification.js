const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who will receive the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Student reference for supervision request notifications
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true
  },

  message: {
    type: String,
    required: true,
    trim: true
  },

  // Notification type for categorization
  type: {
    type: String,
    enum: [
      'supervision_request_accepted', 
      'supervision_request_rejected',
      'supervision_request_received',
      'application_approved',
      'application_rejected',
      'application_feedback',
      'job_application_status',
      'system_announcement',
      'company_misconduct_report',
      'weekly_report_assigned',
      'weekly_report_submitted',
      'weekly_report_reviewed',
      'internship_report_submitted'
    ],
    required: true,
    index: true
  },

  // Related entity references
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },

  relatedEntityType: {
    type: String,
    enum: ['SupervisionRequest', 'Application', 'Job', 'WeeklyReport'],
    index: true
  },

  // Notification status
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
    index: true
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Action URL or deep link
  actionUrl: {
    type: String,
    trim: true
  },

  // Additional metadata
  metadata: {
    supervisorName: String,
    supervisorId: mongoose.Schema.Types.ObjectId,
    jobTitle: String,
    companyName: String,
    requestType: String
  },

  // Auto-read after certain time
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },

  // Read timestamp
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Static method to create supervision request notification
notificationSchema.statics.createSupervisionNotification = async function(
  studentUserId, 
  studentId, 
  supervisorName, 
  supervisorId, 
  status, 
  comments = ''
) {
  const isAccepted = status === 'accepted';
  
  const notification = new this({
    userId: studentUserId,
    studentId: studentId,
    title: isAccepted ? 'Supervision Request Accepted!' : 'Supervision Request Update',
    message: isAccepted 
      ? `Great news! Your supervision request has been accepted by ${supervisorName}. You can now proceed with job applications.`
      : `Your supervision request to ${supervisorName} has been ${status}.${comments ? ` Reason: ${comments}` : ''}`,
    type: isAccepted ? 'supervision_request_accepted' : 'supervision_request_rejected',
    relatedEntityType: 'SupervisionRequest',
    priority: isAccepted ? 'high' : 'medium',
    actionUrl: '/dashboard/student?tab=supervisor-status',
    metadata: {
      supervisorName,
      supervisorId,
      requestType: 'supervision_request',
      redirectTab: 'supervisor-status'
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  return await notification.save();
};

// Static method to create application notification
notificationSchema.statics.createApplicationNotification = async function(
  studentUserId,
  applicationId,
  status,
  supervisorName,
  jobTitle,
  companyName,
  comments = ''
) {
  const isApproved = status === 'approved';
  
  const notification = new this({
    userId: studentUserId,
    title: isApproved ? 'Application Approved!' : 'Application Update',
    message: isApproved
      ? `Your application for "${jobTitle}" at ${companyName} has been approved by ${supervisorName}.`
      : `Your application for "${jobTitle}" requires attention. ${comments}`,
    type: isApproved ? 'application_approved' : 'application_feedback',
    relatedEntityId: applicationId,
    relatedEntityType: 'Application',
    priority: isApproved ? 'high' : 'medium',
    actionUrl: '/dashboard/student?tab=My Applications',
    metadata: {
      supervisorName,
      jobTitle,
      companyName,
      requestType: 'application_review'
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  return await notification.save();
};

// Static method to create supervisor notification when student sends request
notificationSchema.statics.createSupervisorNotification = async function(
  supervisionRequestId,
  supervisorUserId,
  studentName,
  studentId,
  message = ''
) {
  const notification = new this({
    userId: supervisorUserId,
    title: 'New Supervision Request',
    message: `You have received a new supervision request from ${studentName}. ${message}`,
    type: 'supervision_request_received',
    relatedEntityId: supervisionRequestId,
    relatedEntityType: 'SupervisionRequest',
    priority: 'medium',
    actionUrl: '/dashboard/supervisor?tab=requests',
    metadata: {
      studentName,
      studentId,
      requestType: 'supervision_request',
      redirectTab: 'requests'
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  return await notification.save();
};

// Static method to create student notification for weekly reports
notificationSchema.statics.createStudentNotification = async function(
  studentUserId,
  type,
  title,
  message,
  actionUrl,
  supervisorId = null
) {
  const notification = new this({
    userId: studentUserId,
    title: title,
    message: message,
    type: type,
    relatedEntityType: 'WeeklyReport',
    priority: 'medium',
    actionUrl: actionUrl,
    metadata: {
      supervisorId,
      notificationType: type
    },
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });

  return await notification.save();
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
