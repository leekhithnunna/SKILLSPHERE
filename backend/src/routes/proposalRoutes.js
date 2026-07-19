const express = require('express');
const router = express.Router();
const {
  createProposal,
  getMyProposals,
  getProposalsByGig,
  updateProposal,
  negotiateProposal,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
} = require('../controllers/proposalController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   POST /api/proposals
router.post('/', protect, authorizeRoles('freelancer'), createProposal);

// @route   GET /api/proposals/my
router.get('/my', protect, authorizeRoles('freelancer'), getMyProposals);

// @route   GET /api/proposals/gig/:gigId
router.get('/gig/:gigId', protect, getProposalsByGig);

// @route   PUT    /api/proposals/:id
// @route   DELETE /api/proposals/:id (withdraw)
router
  .route('/:id')
  .put(protect, authorizeRoles('freelancer'), updateProposal)
  .delete(protect, authorizeRoles('freelancer'), withdrawProposal);

// @route   PUT /api/proposals/:id/negotiate
router.put('/:id/negotiate', protect, negotiateProposal);

// @route   PUT /api/proposals/:id/accept
router.put('/:id/accept', protect, authorizeRoles('client'), acceptProposal);

// @route   PUT /api/proposals/:id/reject
router.put('/:id/reject', protect, authorizeRoles('client'), rejectProposal);

module.exports = router;
