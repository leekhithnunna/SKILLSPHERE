/**
 * Authorize access based on user roles.
 * Must be used AFTER the protect middleware (req.user must be set).
 *
 * @param {...string} roles - Allowed roles (e.g., "admin", "freelancer")
 * @returns Express middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions',
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
