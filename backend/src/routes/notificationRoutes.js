const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/notifications
router.get('/', protect, getMyNotifications);

// @route   PUT /api/notifications/read-all
router.put('/read-all', protect, markAllAsRead);

// @route   PUT /api/notifications/:id/read
router.put('/:id/read', protect, markAsRead);

module.exports = router;
