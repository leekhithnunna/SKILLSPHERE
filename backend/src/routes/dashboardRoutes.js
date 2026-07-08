const express = require('express');
const router = express.Router();
const {
  getClientDashboard,
  getFreelancerDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET /api/dashboard/client
router.get('/client', protect, authorizeRoles('client', 'admin'), getClientDashboard);

// @route   GET /api/dashboard/freelancer
router.get(
  '/freelancer',
  protect,
  authorizeRoles('freelancer', 'admin'),
  getFreelancerDashboard
);

module.exports = router;
