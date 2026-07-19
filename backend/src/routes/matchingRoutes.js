const express = require('express');
const router = express.Router();
const {
  getFreelancerRecommendations,
  getRecommendedGigs,
  getTrendingSkills,
} = require('../controllers/matchingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET /api/matching/gigs/:gigId/recommendations
router.get('/gigs/:gigId/recommendations', protect, getFreelancerRecommendations);

// @route   GET /api/matching/recommended-gigs
router.get('/recommended-gigs', protect, authorizeRoles('freelancer'), getRecommendedGigs);

// @route   GET /api/matching/trending-skills
router.get('/trending-skills', getTrendingSkills);

module.exports = router;
