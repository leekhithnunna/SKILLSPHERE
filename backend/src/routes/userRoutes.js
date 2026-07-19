const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getPublicProfile,
  updateFreelancerProfile,
  addPortfolioItem,
  removePortfolioItem,
  uploadResume,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadImage, uploadDocument } = require('../middleware/uploadMiddleware');

// @route   GET /api/users/profile
router.get('/profile', protect, getProfile);

// @route   PUT /api/users/profile
router.put('/profile', protect, updateProfile);

// @route   PUT /api/users/freelancer-profile
router.put(
  '/freelancer-profile',
  protect,
  authorizeRoles('freelancer'),
  updateFreelancerProfile
);

// @route   POST   /api/users/portfolio
// @route   DELETE /api/users/portfolio/:itemId
router.post(
  '/portfolio',
  protect,
  authorizeRoles('freelancer'),
  uploadImage.single('image'),
  addPortfolioItem
);
router.delete('/portfolio/:itemId', protect, authorizeRoles('freelancer'), removePortfolioItem);

// @route   POST /api/users/resume
router.post(
  '/resume',
  protect,
  authorizeRoles('freelancer'),
  uploadDocument.single('resume'),
  uploadResume
);

// @route   GET /api/users/:id — must be last so it doesn't shadow routes above
router.get('/:id', optionalAuth, getPublicProfile);

module.exports = router;
