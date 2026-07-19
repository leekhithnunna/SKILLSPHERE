const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const User = require('../models/User');

/**
 * @desc    Client dashboard stats
 * @route   GET /api/dashboard/client
 * @access  Private — client
 */
const getClientDashboard = async (req, res) => {
  const clientId = req.user._id;

  const [totalGigs, openGigs, activeGigs, completedGigs, totalProposals] =
    await Promise.all([
      Gig.countDocuments({ client: clientId }),
      Gig.countDocuments({ client: clientId, status: 'open' }),
      Gig.countDocuments({ client: clientId, status: 'in-progress' }),
      Gig.countDocuments({ client: clientId, status: 'completed' }),
      Proposal.countDocuments({
        gig: {
          $in: await Gig.distinct('_id', { client: clientId }),
        },
      }),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalGigs,
      openGigs,
      activeGigs,
      completedGigs,
      totalProposalsReceived: totalProposals,
    },
  });
};

/**
 * @desc    Freelancer dashboard stats
 * @route   GET /api/dashboard/freelancer
 * @access  Private — freelancer
 */
const getFreelancerDashboard = async (req, res) => {
  const freelancerId = req.user._id;

  const [totalProposals, pendingProposals, acceptedProposals, activeJobs] =
    await Promise.all([
      Proposal.countDocuments({ freelancer: freelancerId }),
      Proposal.countDocuments({ freelancer: freelancerId, status: 'pending' }),
      Proposal.countDocuments({ freelancer: freelancerId, status: 'accepted' }),
      Proposal.countDocuments({ freelancer: freelancerId, status: 'accepted' }),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalProposals,
      pendingProposals,
      acceptedProposals,
      activeJobs,
    },
  });
};

/**
 * @desc    Freelancer analytics: profile views, gig applications, earnings,
 *          monthly revenue chart, client feedback breakdown
 * @route   GET /api/dashboard/freelancer/analytics
 * @access  Private — freelancer
 */
const getFreelancerAnalytics = async (req, res) => {
  const freelancerId = req.user._id;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    user,
    totalApplications,
    applicationsByStatus,
    earningsAgg,
    escrowAgg,
    monthlyRevenueAgg,
    reviews,
  ] = await Promise.all([
    User.findById(freelancerId).select('profileViews reputationScore reviewCount'),
    Proposal.countDocuments({ freelancer: freelancerId }),
    Proposal.aggregate([
      { $match: { freelancer: freelancerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { freelancer: freelancerId, status: 'released' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { freelancer: freelancerId, status: 'escrow' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { freelancer: freelancerId, status: 'released', releasedAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$releasedAt' }, month: { $month: '$releasedAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Review.find({ reviewee: freelancerId, flagged: false }),
  ]);

  const criteriaKeys = ['communication', 'quality', 'timeliness', 'professionalism'];
  const feedbackBreakdown = {};
  criteriaKeys.forEach((key) => {
    const values = reviews.map((r) => r.criteria?.[key]).filter((v) => typeof v === 'number');
    feedbackBreakdown[key] = values.length
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
      : null;
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = monthlyRevenueAgg.map((m) => ({
    label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
    revenue: m.total,
  }));

  const applicationStatusCounts = Object.fromEntries(
    applicationsByStatus.map((a) => [a._id, a.count])
  );

  res.status(200).json({
    success: true,
    data: {
      profileViews: user.profileViews,
      reputationScore: user.reputationScore,
      reviewCount: user.reviewCount,
      totalApplications,
      applicationStatusCounts,
      totalEarned: earningsAgg[0]?.total || 0,
      pendingEscrow: escrowAgg[0]?.total || 0,
      monthlyRevenue,
      feedbackBreakdown,
    },
  });
};

module.exports = { getClientDashboard, getFreelancerDashboard, getFreelancerAnalytics };
