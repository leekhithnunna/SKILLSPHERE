const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { uploadBuffer } = require('../utils/uploadFile');

/**
 * @desc    List the logged-in user's conversations, most recently active first
 * @route   GET /api/conversations
 * @access  Private
 */
const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name profileImage role')
    .populate('gig', 'title')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, data: conversations });
};

/**
 * @desc    Get an existing conversation with a participant (optionally
 *          scoped to a gig), or create one
 * @route   POST /api/conversations
 * @access  Private
 */
const getOrCreateConversation = async (req, res) => {
  const { participantId, gigId } = req.body;

  if (!participantId) {
    return res.status(400).json({ success: false, message: 'participantId is required' });
  }

  if (participantId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      gig: gigId || null,
    });
  }

  await conversation.populate('participants', 'name profileImage role');
  await conversation.populate('gig', 'title');

  res.status(200).json({ success: true, data: conversation });
};

/**
 * @desc    Get message history for a conversation (paginated, oldest first
 *          within each page)
 * @route   GET /api/conversations/:id/messages
 * @access  Private — participant only
 */
const getMessages = async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
  }

  const { page = 1, limit = 30 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'name profileImage')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.status(200).json({ success: true, data: messages.reverse() });
};

/**
 * @desc    Upload a chat file attachment (client uploads via REST first,
 *          then sends the returned {url,name,type} through the
 *          message:send Socket.IO event)
 * @route   POST /api/conversations/:id/attachments
 * @access  Private — participant only
 */
const uploadChatAttachment = async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Not authorized for this conversation' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploaded = await uploadBuffer(req.file.buffer, {
    folder: 'chat',
    filename: req.file.originalname,
    resourceType: 'auto',
  });

  res.status(201).json({
    success: true,
    data: { url: uploaded.url, name: req.file.originalname, type: req.file.mimetype },
  });
};

module.exports = { getConversations, getOrCreateConversation, getMessages, uploadChatAttachment };
