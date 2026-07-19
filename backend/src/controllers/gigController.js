const Gig = require('../models/Gig');
const User = require('../models/User');
const Proposal = require('../models/Proposal');
const { uploadBuffer } = require('../utils/uploadFile');
const notify = require('../utils/notify');

/**
 * @desc    Create a new gig
 * @route   POST /api/gigs
 * @access  Private — client, admin
 */
const createGig = async (req, res) => {
  const { title, description, budgetMin, budgetMax, skillsRequired, deadline, status, milestones, location } = req.body;

  if (!title || !description || !budgetMin || !budgetMax) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, budgetMin, and budgetMax are required',
    });
  }

  const gig = await Gig.create({
    title,
    description,
    budgetMin,
    budgetMax,
    skillsRequired: skillsRequired || [],
    deadline: deadline || null,
    status: status || 'open',
    milestones: milestones || [],
    location: location || undefined,
    client: req.user._id,
  });

  res.status(201).json({ success: true, data: gig });
};

/**
 * @desc    Get all gigs with search, filter, pagination
 * @route   GET /api/gigs
 * @access  Public
 */
const getGigs = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    skill,
    budgetMin,
    budgetMax,
    status,
    search,
    city,
    country,
  } = req.query;

  const query = { isApproved: true };

  if (city) query['location.city'] = new RegExp(`^${city}$`, 'i');
  if (country) query['location.country'] = new RegExp(`^${country}$`, 'i');

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (skill) {
    query.skillsRequired = { $in: [new RegExp(skill, 'i')] };
  }

  // Range overlap: a gig matches if its [budgetMin, budgetMax] range
  // intersects the requested [budgetMin, budgetMax] filter range.
  if (budgetMin) query.budgetMax = { $gte: Number(budgetMin) };
  if (budgetMax) query.budgetMin = { $lte: Number(budgetMax) };

  if (status) {
    query.status = status;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [gigs, total] = await Promise.all([
    Gig.find(query)
      .populate('client', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Gig.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total,
    data: gigs,
  });
};

/**
 * @desc    Get single gig by ID
 * @route   GET /api/gigs/:id
 * @access  Public
 */
const getGigById = async (req, res) => {
  const gig = await Gig.findById(req.params.id).populate(
    'client',
    'name profileImage bio email'
  );

  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const gigData = gig.toObject();

  // Surface who the gig was awarded to once work has started — used by the
  // chat, payments, and review UIs to know who the counterpart is without
  // every viewer needing access to the (owner/admin-only) proposals list.
  if (['in-progress', 'completed'].includes(gig.status)) {
    const acceptedProposal = await Proposal.findOne({ gig: gig._id, status: 'accepted' }).populate(
      'freelancer',
      'name profileImage'
    );
    gigData.acceptedFreelancer = acceptedProposal?.freelancer || null;
  }

  res.status(200).json({ success: true, data: gigData });
};

/**
 * @desc    Update a gig
 * @route   PUT /api/gigs/:id
 * @access  Private — gig owner (client) or admin
 */
const updateGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const isOwner = gig.client.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this gig',
    });
  }

  const { title, description, budgetMin, budgetMax, skillsRequired, deadline, status, milestones, location } = req.body;

  if (title !== undefined) gig.title = title;
  if (description !== undefined) gig.description = description;
  if (budgetMin !== undefined) gig.budgetMin = budgetMin;
  if (budgetMax !== undefined) gig.budgetMax = budgetMax;
  if (skillsRequired !== undefined) gig.skillsRequired = skillsRequired;
  if (deadline !== undefined) gig.deadline = deadline;
  if (status !== undefined) gig.status = status;
  if (milestones !== undefined) gig.milestones = milestones;
  if (location !== undefined) gig.location = location;

  await gig.save();

  res.status(200).json({ success: true, data: gig });
};

/**
 * @desc    Delete a gig
 * @route   DELETE /api/gigs/:id
 * @access  Private — gig owner (client) or admin
 */
const deleteGig = async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const isOwner = gig.client.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this gig',
    });
  }

  await gig.deleteOne();

  res.status(200).json({ success: true, message: 'Gig deleted successfully' });
};

/**
 * @desc    Get gigs created by the logged-in client
 * @route   GET /api/gigs/my
 * @access  Private — client
 */
const getMyGigs = async (req, res) => {
  const gigs = await Gig.find({ client: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: gigs });
};

/**
 * @desc    Get gigs the logged-in freelancer has been invited to
 * @route   GET /api/gigs/invited
 * @access  Private — freelancer
 */
const getInvitedGigs = async (req, res) => {
  const gigs = await Gig.find({ invitedFreelancers: req.user._id })
    .populate('client', 'name profileImage')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: gigs });
};

/**
 * @desc    Invite a freelancer to a gig
 * @route   POST /api/gigs/:id/invite
 * @access  Private — gig owner (client)
 */
const inviteFreelancer = async (req, res) => {
  const { freelancerId, email } = req.body;

  if (!freelancerId && !email) {
    return res.status(400).json({ success: false, message: 'freelancerId or email is required' });
  }

  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to invite freelancers to this gig' });
  }

  const freelancer = freelancerId
    ? await User.findOne({ _id: freelancerId, role: 'freelancer' })
    : await User.findOne({ email: email.toLowerCase(), role: 'freelancer' });

  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' });
  }

  if (gig.invitedFreelancers.some((id) => id.toString() === freelancer._id.toString())) {
    return res.status(400).json({ success: false, message: 'Freelancer already invited' });
  }

  gig.invitedFreelancers.push(freelancer._id);
  await gig.save();

  await notify(
    freelancer._id,
    {
      type: 'gig_invite',
      title: 'You were invited to a gig',
      message: `${req.user.name} invited you to apply for "${gig.title}"`,
      link: `/gigs/${gig._id}`,
    },
    { email: true }
  );

  res.status(200).json({ success: true, data: gig });
};

/**
 * @desc    Attach a document to a gig
 * @route   POST /api/gigs/:id/attachments
 * @access  Private — gig owner (client)
 */
const addAttachment = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to modify this gig' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploaded = await uploadBuffer(req.file.buffer, {
    folder: 'gig-attachments',
    filename: req.file.originalname,
    resourceType: 'raw',
  });

  gig.attachments.push({ url: uploaded.url, name: req.file.originalname, type: req.file.mimetype });
  await gig.save();

  res.status(201).json({ success: true, data: gig });
};

/**
 * @desc    Remove a document attachment from a gig
 * @route   DELETE /api/gigs/:id/attachments/:attachmentId
 * @access  Private — gig owner (client)
 */
const removeAttachment = async (req, res) => {
  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to modify this gig' });
  }

  gig.attachments = gig.attachments.filter((a) => a._id.toString() !== req.params.attachmentId);
  await gig.save();

  res.status(200).json({ success: true, data: gig });
};

/**
 * @desc    Freelancer marks a milestone as completed and ready for review
 * @route   PUT /api/gigs/:id/milestones/:milestoneId/complete
 * @access  Private — the gig's accepted freelancer
 */
const completeMilestone = async (req, res) => {
  const { completionNote } = req.body;

  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const acceptedProposal = await Proposal.findOne({ gig: gig._id, status: 'accepted' });
  if (!acceptedProposal || acceptedProposal.freelancer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this milestone' });
  }

  const milestone = gig.milestones.id(req.params.milestoneId);
  if (!milestone) {
    return res.status(404).json({ success: false, message: 'Milestone not found' });
  }

  if (!['pending', 'in-progress'].includes(milestone.status)) {
    return res.status(400).json({ success: false, message: 'This milestone cannot be marked complete' });
  }

  milestone.status = 'completed';
  milestone.completionNote = completionNote || '';
  milestone.completedAt = new Date();
  await gig.save();

  await notify(
    gig.client,
    {
      type: 'milestone_completed',
      title: 'Milestone marked complete',
      message: `${req.user.name} marked "${milestone.title}" as complete on "${gig.title}" — review and release payment when ready`,
      link: `/gigs/${gig._id}`,
    },
    { email: true }
  );

  res.status(200).json({ success: true, data: gig });
};

module.exports = {
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
  completeMilestone,
};
