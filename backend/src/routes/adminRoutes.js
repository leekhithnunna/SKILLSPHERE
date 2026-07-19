const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  setSuspendUser,
  verifyFreelancer,
  getAllGigs,
  approveGig,
  getAllPayments,
  getFlaggedReviews,
  getAdminLogs,
  getAnalytics,
} = require('../controllers/adminController');
const { getAllDisputes, resolveDispute } = require('../controllers/disputeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Every route in this file is admin-only
router.use(protect, authorizeRoles('admin'));

router.get('/analytics', getAnalytics);
router.get('/logs', getAdminLogs);

router.get('/users', getAllUsers);
router.put('/users/:id/suspend', setSuspendUser);
router.put('/users/:id/verify-freelancer', verifyFreelancer);

router.get('/gigs', getAllGigs);
router.put('/gigs/:id/approve', approveGig);

router.get('/payments', getAllPayments);
router.get('/reviews/flagged', getFlaggedReviews);

router.get('/disputes', getAllDisputes);
router.put('/disputes/:id/resolve', resolveDispute);

module.exports = router;
