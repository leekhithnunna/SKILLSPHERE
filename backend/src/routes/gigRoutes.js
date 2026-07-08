const express = require('express');
const router = express.Router();
const {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs,
} = require('../controllers/gigController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET  /api/gigs/my  — must be before /:id to avoid conflict
router.get('/my', protect, authorizeRoles('client', 'admin'), getMyGigs);

// @route   GET  /api/gigs
// @route   POST /api/gigs
router
  .route('/')
  .get(getGigs)
  .post(protect, authorizeRoles('client', 'admin'), createGig);

// @route   GET    /api/gigs/:id
// @route   PUT    /api/gigs/:id
// @route   DELETE /api/gigs/:id
router
  .route('/:id')
  .get(getGigById)
  .put(protect, updateGig)
  .delete(protect, deleteGig);

module.exports = router;
