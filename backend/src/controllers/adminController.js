const User = require('../models/User');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Proposal = require('../models/Proposal');
const AdminLog = require('../models/AdminLog');
const notify = require('../utils/notify');
const logAdminAction = require('../utils/logAdminAction');

/**
 * @desc    List/search all users
 * @route   GET /api/admin/users
 * @access  Private — admin
 */
const getAllUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email role isVerified isSuspended reputationScore reviewCount createdAt freelancerProfile.isVerifiedBadge')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  res.status(200).json({ success: true, data: users, page: pageNum, pages: Math.ceil(total / limitNum), total });
};

/**
 * @desc    Suspend or unsuspend a user account
 * @route   PUT /api/admin/users/:id/suspend
 * @access  Private — admin
 */
const setSuspendUser = async (req, res) => {
  const { suspended } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (user.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Cannot suspend an admin account' });
  }

  user.isSuspended = Boolean(suspended);
  await user.save();

  await logAdminAction(req.user._id, suspended ? 'suspend_user' : 'unsuspend_user', 'User', user._id);

  res.status(200).json({ success: true, data: user });
};

/**
 * @desc    Grant the "verified freelancer" badge
 * @route   PUT /api/admin/users/:id/verify-freelancer
 * @access  Private — admin
 */
const verifyFreelancer = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'freelancer' });
  if (!user) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' });
  }

  user.freelancerProfile.isVerifiedBadge = true;
  await user.save();

  await logAdminAction(req.user._id, 'verify_freelancer', 'User', user._id);

  await notify(user._id, {
    type: 'account_verified',
    title: 'You are now a verified freelancer',
    message: 'An admin reviewed and verified your profile. The verified badge now shows on your public profile.',
    link: '/freelancer-profile',
  });

  res.status(200).json({ success: true, data: user });
};

/**
 * @desc    List all gigs (admin moderation view)
 * @route   GET /api/admin/gigs
 * @access  Private — admin
 */
const getAllGigs = async (req, res) => {
  const { status, approved, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (approved !== undefined) query.isApproved = approved === 'true';

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [gigs, total] = await Promise.all([
    Gig.find(query)
      .populate('client', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Gig.countDocuments(query),
  ]);

  res.status(200).json({ success: true, data: gigs, page: pageNum, pages: Math.ceil(total / limitNum), total });
};

/**
 * @desc    Approve a gig for public listing
 * @route   PUT /api/admin/gigs/:id/approve
 * @access  Private — admin
 */
const approveGig = async (req, res) => {
  const { approved = true } = req.body;

  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  gig.isApproved = Boolean(approved);
  await gig.save();

  await logAdminAction(req.user._id, approved ? 'approve_gig' : 'unapprove_gig', 'Gig', gig._id);

  if (approved) {
    await notify(gig.client, {
      type: 'gig_approved',
      title: 'Your gig was approved',
      message: `"${gig.title}" is now live and visible to freelancers.`,
      link: `/gigs/${gig._id}`,
    });
  }

  res.status(200).json({ success: true, data: gig });
};

/**
 * @desc    Payment monitoring — all payments platform-wide
 * @route   GET /api/admin/payments
 * @access  Private — admin
 */
const getAllPayments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('gig', 'title')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payment.countDocuments(query),
  ]);

  res.status(200).json({ success: true, data: payments, page: pageNum, pages: Math.ceil(total / limitNum), total });
};

/**
 * @desc    Fraud detection — reviews flagged by the automated heuristics
 * @route   GET /api/admin/reviews/flagged
 * @access  Private — admin
 */
const getFlaggedReviews = async (req, res) => {
  const reviews = await Review.find({ flagged: true })
    .populate('reviewer', 'name email')
    .populate('reviewee', 'name email')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: reviews });
};

/**
 * @desc    Admin action audit log
 * @route   GET /api/admin/logs
 * @access  Private — admin
 */
const getAdminLogs = async (req, res) => {
  const logs = await AdminLog.find()
    .populate('admin', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({ success: true, data: logs });
};

/**
 * @desc    Platform analytics: revenue, active freelancers, top categories,
 *          job success rate
 * @route   GET /api/admin/analytics
 * @access  Private — admin
 */
const getAnalytics = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    revenueAgg,
    activeFreelancers,
    totalFreelancers,
    totalClients,
    completedGigs,
    closedGigs,
    topCategoriesAgg,
    pendingApprovalGigs,
    flaggedReviewCount,
  ] = await Promise.all([
    Payment.aggregate([{ $match: { status: 'released' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Proposal.distinct('freelancer', { status: 'accepted', updatedAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ role: 'freelancer' }),
    User.countDocuments({ role: 'client' }),
    Gig.countDocuments({ status: 'completed' }),
    Gig.countDocuments({ status: 'closed' }),
    Gig.aggregate([
      { $unwind: '$skillsRequired' },
      { $group: { _id: { $toLower: '$skillsRequired' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Gig.countDocuments({ isApproved: false }),
    Review.countDocuments({ flagged: true }),
  ]);

  const platformRevenue = revenueAgg[0]?.total || 0;
  const finishedGigs = completedGigs + closedGigs;
  const jobSuccessRate = finishedGigs > 0 ? Math.round((completedGigs / finishedGigs) * 1000) / 10 : 0;

  res.status(200).json({
    success: true,
    data: {
      platformRevenue,
      activeFreelancers: activeFreelancers.length,
      totalFreelancers,
      totalClients,
      completedGigs,
      jobSuccessRate,
      topCategories: topCategoriesAgg.map((c) => ({ skill: c._id, count: c.count })),
      pendingApprovalGigs,
      flaggedReviewCount,
    },
  });
};

module.exports = {
  getAllUsers,
  setSuspendUser,
  verifyFreelancer,
  getAllGigs,
  approveGig,
  getAllPayments,
  getFlaggedReviews,
  getAdminLogs,
  getAnalytics,
};
