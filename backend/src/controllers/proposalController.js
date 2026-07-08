const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');

/**
 * @desc    Submit a proposal on a gig
 * @route   POST /api/proposals
 * @access  Private — freelancer
 */
const createProposal = async (req, res) => {
  const { gigId, coverLetter, bidAmount, estimatedDays } = req.body;

  if (!gigId || !coverLetter || !bidAmount || !estimatedDays) {
    return res.status(400).json({
      success: false,
      message: 'gigId, coverLetter, bidAmount, and estimatedDays are required',
    });
  }

  const gig = await Gig.findById(gigId);

  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  if (gig.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'This gig is no longer accepting proposals',
    });
  }

  // Prevent client from applying to their own gig
  if (gig.client.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot submit a proposal on your own gig',
    });
  }

  // Duplicate check
  const existing = await Proposal.findOne({
    freelancer: req.user._id,
    gig: gigId,
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted a proposal for this gig',
    });
  }

  const proposal = await Proposal.create({
    freelancer: req.user._id,
    gig: gigId,
    coverLetter,
    bidAmount,
    estimatedDays,
  });

  await proposal.populate('gig', 'title budget');
  await proposal.populate('freelancer', 'name profileImage');

  res.status(201).json({ success: true, data: proposal });
};

/**
 * @desc    Get proposals submitted by the logged-in freelancer
 * @route   GET /api/proposals/my
 * @access  Private — freelancer
 */
const getMyProposals = async (req, res) => {
  const proposals = await Proposal.find({ freelancer: req.user._id })
    .populate('gig', 'title budget status deadline skillsRequired')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: proposals });
};

/**
 * @desc    Get all proposals for a gig (gig owner or admin only)
 * @route   GET /api/proposals/gig/:gigId
 * @access  Private — gig owner (client), admin
 */
const getProposalsByGig = async (req, res) => {
  const gig = await Gig.findById(req.params.gigId);

  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const isOwner = gig.client.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view these proposals',
    });
  }

  const proposals = await Proposal.find({ gig: req.params.gigId })
    .populate('freelancer', 'name profileImage bio skills email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: proposals });
};

/**
 * @desc    Update a proposal (freelancer edits cover letter / bid)
 * @route   PUT /api/proposals/:id
 * @access  Private — proposal owner (freelancer)
 */
const updateProposal = async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }

  if (proposal.freelancer.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this proposal',
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending proposals can be edited',
    });
  }

  const { coverLetter, bidAmount, estimatedDays } = req.body;

  if (coverLetter !== undefined) proposal.coverLetter = coverLetter;
  if (bidAmount !== undefined) proposal.bidAmount = bidAmount;
  if (estimatedDays !== undefined) proposal.estimatedDays = estimatedDays;

  await proposal.save();

  res.status(200).json({ success: true, data: proposal });
};

/**
 * @desc    Withdraw a proposal (sets status to withdrawn)
 * @route   DELETE /api/proposals/:id
 * @access  Private — proposal owner (freelancer)
 */
const withdrawProposal = async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }

  if (proposal.freelancer.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to withdraw this proposal',
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending proposals can be withdrawn',
    });
  }

  proposal.status = 'withdrawn';
  await proposal.save();

  res.status(200).json({
    success: true,
    message: 'Proposal withdrawn successfully',
    data: proposal,
  });
};

/**
 * @desc    Accept a proposal — gig → in-progress, others → rejected
 * @route   PUT /api/proposals/:id/accept
 * @access  Private — gig owner (client)
 */
const acceptProposal = async (req, res) => {
  const proposal = await Proposal.findById(req.params.id).populate('gig');

  if (!proposal) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }

  if (proposal.gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to accept this proposal',
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending proposals can be accepted',
    });
  }

  // Accept this proposal
  proposal.status = 'accepted';
  await proposal.save();

  // Reject all other pending proposals for this gig
  await Proposal.updateMany(
    { gig: proposal.gig._id, _id: { $ne: proposal._id }, status: 'pending' },
    { $set: { status: 'rejected' } }
  );

  // Set gig status to in-progress
  await Gig.findByIdAndUpdate(proposal.gig._id, { status: 'in-progress' });

  res.status(200).json({ success: true, data: proposal, message: 'Proposal accepted' });
};

/**
 * @desc    Reject a proposal
 * @route   PUT /api/proposals/:id/reject
 * @access  Private — gig owner (client)
 */
const rejectProposal = async (req, res) => {
  const proposal = await Proposal.findById(req.params.id).populate('gig');

  if (!proposal) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }

  if (proposal.gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reject this proposal',
    });
  }

  if (proposal.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending proposals can be rejected',
    });
  }

  proposal.status = 'rejected';
  await proposal.save();

  res.status(200).json({ success: true, data: proposal, message: 'Proposal rejected' });
};

module.exports = {
  createProposal,
  getMyProposals,
  getProposalsByGig,
  updateProposal,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
};
