const ProgressLog = require('../models/ProgressLog');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const { uploadBuffer } = require('../utils/uploadFile');
const notify = require('../utils/notify');

/**
 * @desc    Post a progress update (with an optional self-reported
 *          completion percentage and file deliverable) on an in-progress gig
 * @route   POST /api/gigs/:id/progress-logs
 * @access  Private — the gig's accepted freelancer
 */
const createProgressLog = async (req, res) => {
  const { message, completionPercentage } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const acceptedProposal = await Proposal.findOne({ gig: gig._id, status: 'accepted' });
  if (!acceptedProposal || acceptedProposal.freelancer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to post progress on this gig' });
  }

  let attachments = [];
  if (req.file) {
    const uploaded = await uploadBuffer(req.file.buffer, {
      folder: 'progress-logs',
      filename: req.file.originalname,
      resourceType: 'auto',
    });
    attachments = [{ url: uploaded.url, name: req.file.originalname, type: req.file.mimetype }];
  }

  const parsedPercentage = completionPercentage !== undefined ? Number(completionPercentage) : null;

  const log = await ProgressLog.create({
    gig: gig._id,
    postedBy: req.user._id,
    message,
    completionPercentage: parsedPercentage,
    attachments,
  });

  // A freelancer's explicit self-report overrides the milestone-derived
  // percentage until the next milestone approval recomputes it.
  if (parsedPercentage !== null && !Number.isNaN(parsedPercentage)) {
    gig.completionPercentage = Math.max(0, Math.min(100, parsedPercentage));
    await gig.save();
  }

  await notify(gig.client, {
    type: 'progress_update',
    title: 'Progress update posted',
    message: `${req.user.name} posted a progress update on "${gig.title}"${parsedPercentage !== null ? ` (${parsedPercentage}% complete)` : ''}`,
    link: `/gigs/${gig._id}`,
  });

  res.status(201).json({ success: true, data: log });
};

/**
 * @desc    Get the progress log timeline for a gig
 * @route   GET /api/gigs/:id/progress-logs
 * @access  Private — gig client or accepted freelancer
 */
const getProgressLogs = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const acceptedProposal = await Proposal.findOne({ gig: gig._id, status: 'accepted' });
  const userId = req.user._id.toString();
  const isParticipant =
    gig.client.toString() === userId ||
    (acceptedProposal && acceptedProposal.freelancer.toString() === userId);

  if (!isParticipant && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const logs = await ProgressLog.find({ gig: gig._id })
    .populate('postedBy', 'name profileImage')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: logs });
};

module.exports = { createProgressLog, getProgressLogs };
