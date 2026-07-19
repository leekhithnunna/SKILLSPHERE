const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  uploadChatAttachment,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');

// @route   GET  /api/conversations
// @route   POST /api/conversations
router.route('/').get(protect, getConversations).post(protect, getOrCreateConversation);

// @route   GET /api/conversations/:id/messages
router.get('/:id/messages', protect, getMessages);

// @route   POST /api/conversations/:id/attachments
router.post('/:id/attachments', protect, uploadAny.single('file'), uploadChatAttachment);

module.exports = router;
