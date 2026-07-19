const express = require('express');
const router = express.Router();
const { createDispute, addEvidence, getMyDisputes, getDisputeById } = require('../controllers/disputeController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');

// @route   POST /api/disputes
router.post('/', protect, createDispute);

// @route   GET /api/disputes/my
router.get('/my', protect, getMyDisputes);

// @route   POST /api/disputes/:id/evidence
router.post('/:id/evidence', protect, uploadAny.single('file'), addEvidence);

// @route   GET /api/disputes/:id
router.get('/:id', protect, getDisputeById);

module.exports = router;
