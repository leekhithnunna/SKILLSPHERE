const AdminLog = require('../models/AdminLog');

/**
 * Records an admin action for audit purposes. Fire-and-forget from the
 * caller's perspective, but awaited so failures surface in error logs
 * rather than being silently swallowed.
 */
const logAdminAction = (adminId, action, targetType, targetId, details = {}) =>
  AdminLog.create({ admin: adminId, action, targetType, targetId, details });

module.exports = logAdminAction;
