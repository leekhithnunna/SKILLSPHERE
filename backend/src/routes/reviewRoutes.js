const express = require('express');
const router = express.Router();
const { createReview, getReviewsForUser, getMyReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/reviews
router.post('/', protect, createReview);

// @route   GET /api/reviews/my
router.get('/my', protect, getMyReviews);

// @route   GET /api/reviews/user/:userId
router.get('/user/:userId', getReviewsForUser);

module.exports = router;
