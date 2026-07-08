const Gig = require('../models/Gig');

/**
 * @desc    Create a new gig
 * @route   POST /api/gigs
 * @access  Private — client, admin
 */
const createGig = async (req, res) => {
  const { title, description, budget, skillsRequired, deadline, status } = req.body;

  if (!title || !description || !budget) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, and budget are required',
    });
  }

  const gig = await Gig.create({
    title,
    description,
    budget,
    skillsRequired: skillsRequired || [],
    deadline: deadline || null,
    status: status || 'open',
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
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (skill) {
    query.skillsRequired = { $in: [new RegExp(skill, 'i')] };
  }

  if (budgetMin || budgetMax) {
    query.budget = {};
    if (budgetMin) query.budget.$gte = Number(budgetMin);
    if (budgetMax) query.budget.$lte = Number(budgetMax);
  }

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

  res.status(200).json({ success: true, data: gig });
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

  const { title, description, budget, skillsRequired, deadline, status } = req.body;

  if (title !== undefined) gig.title = title;
  if (description !== undefined) gig.description = description;
  if (budget !== undefined) gig.budget = budget;
  if (skillsRequired !== undefined) gig.skillsRequired = skillsRequired;
  if (deadline !== undefined) gig.deadline = deadline;
  if (status !== undefined) gig.status = status;

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

module.exports = { createGig, getGigs, getGigById, updateGig, deleteGig, getMyGigs };
