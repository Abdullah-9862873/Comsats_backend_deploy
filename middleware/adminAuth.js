/**
 * Admin Role Check Middleware
 * Ensures only users with admin role can access protected routes
 */
const roleCheck = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Assuming auth middleware has already verified token and set req.user
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (req.user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${requiredRole} role required.`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during role verification'
      });
    }
  };
};

/**
 * Audit Log Middleware
 * Logs admin actions for audit trail
 */
const auditLogger = (action) => {
  return async (req, res, next) => {
    try {
      // Store audit info in req for later use
      req.auditInfo = {
        action,
        adminUserId: req.user._id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };
      next();
    } catch (error) {
      console.error('Audit logger error:', error);
      next(); // Don't block the request if audit logging fails
    }
  };
};

/**
 * Create Audit Log Entry
 * Call this function in controllers to log actions
 */
const createAuditLog = async (auditInfo, additionalData = {}) => {
  try {
    const AuditLog = require('../models/AuditLog');
    
    const logEntry = new AuditLog({
      action: auditInfo.action,
      adminUserId: auditInfo.adminUserId,
      ipAddress: auditInfo.ipAddress,
      userAgent: auditInfo.userAgent,
      ...additionalData
    });

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - logging failure shouldn't break the main action
  }
};

module.exports = {
  roleCheck,
  auditLogger,
  createAuditLog
};