const express = require('express');
const router = express.Router();
const {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs,
  getInvitedGigs,
  inviteFreelancer,
  addAttachment,
  removeAttachment,
} = require('../controllers/gigController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadDocument } = require('../middleware/uploadMiddleware');

// @route   GET  /api/gigs/my  — must be before /:id to avoid conflict
router.get('/my', protect, authorizeRoles('client', 'admin'), getMyGigs);

// @route   GET  /api/gigs/invited  — must be before /:id
router.get('/invited', protect, authorizeRoles('freelancer'), getInvitedGigs);

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

// @route   POST /api/gigs/:id/invite
router.post('/:id/invite', protect, authorizeRoles('client'), inviteFreelancer);

// @route   POST   /api/gigs/:id/attachments
// @route   DELETE /api/gigs/:id/attachments/:attachmentId
router.post(
  '/:id/attachments',
  protect,
  authorizeRoles('client'),
  uploadDocument.single('file'),
  addAttachment
);
router.delete('/:id/attachments/:attachmentId', protect, authorizeRoles('client'), removeAttachment);

module.exports = router;
