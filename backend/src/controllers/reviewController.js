const Review = require('../models/Review');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const notify = require('../utils/notify');
const { computeWeightedScore } = require('../utils/reputationScore');

/**
 * Recomputes and persists a user's denormalized reputation summary from
 * their non-flagged reviews.
 */
const refreshReputation = async (userId) => {
  const reviews = await Review.find({ reviewee: userId, flagged: false }).populate('gig', 'budgetMax');
  const reputationScore = computeWeightedScore(reviews);
  await User.findByIdAndUpdate(userId, { reputationScore, reviewCount: reviews.length });
};

/**
 * Basic fraud heuristics, run at review-creation time:
 *  - review velocity: too many reviews from the same reviewer in a short
 *    window looks like spam/manipulation
 *  - duplicate comment text: copy-pasted reviews are a common fake-review
 *    pattern
 * Returns { flagged, flagReason }.
 */
const detectFraud = async (reviewerId, comment) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentCount = await Review.countDocuments({ reviewer: reviewerId, createdAt: { $gte: tenMinutesAgo } });

  if (recentCount >= 3) {
    return { flagged: true, flagReason: 'High review velocity from this reviewer' };
  }

  if (comment && comment.trim().length > 0) {
    const duplicate = await Review.findOne({ reviewer: reviewerId, comment: comment.trim() });
    if (duplicate) {
      return { flagged: true, flagReason: 'Duplicate review text from this reviewer' };
    }
  }

  return { flagged: false, flagReason: '' };
};

/**
 * @desc    Leave a review for a counterpart on a completed gig
 * @route   POST /api/reviews
 * @access  Private — must be the gig's client or its accepted freelancer
 */
const createReview = async (req, res) => {
  const { gigId, revieweeId, rating, comment, criteria } = req.body;

  if (!gigId || !revieweeId || !rating) {
    return res.status(400).json({ success: false, message: 'gigId, revieweeId, and rating are required' });
  }

  if (revieweeId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot review yourself' });
  }

  const gig = await Gig.findById(gigId);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  if (gig.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Reviews can only be left on completed gigs' });
  }

  const acceptedProposal = await Proposal.findOne({ gig: gigId, status: 'accepted' });
  if (!acceptedProposal) {
    return res.status(400).json({ success: false, message: 'This gig has no accepted freelancer to review' });
  }

  const reviewerId = req.user._id.toString();
  const clientId = gig.client.toString();
  const freelancerId = acceptedProposal.freelancer.toString();

  const isClientReviewingFreelancer = reviewerId === clientId && revieweeId === freelancerId;
  const isFreelancerReviewingClient = reviewerId === freelancerId && revieweeId === clientId;

  if (!isClientReviewingFreelancer && !isFreelancerReviewingClient) {
    return res.status(403).json({
      success: false,
      message: 'You can only review the client/freelancer you worked with on this gig',
    });
  }

  const { flagged, flagReason } = await detectFraud(req.user._id, comment);

  let review;
  try {
    review = await Review.create({
      gig: gigId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment: comment || '',
      criteria: criteria || {},
      flagged,
      flagReason,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already reviewed this user for this gig' });
    }
    throw err;
  }

  if (!flagged) {
    await refreshReputation(revieweeId);
  }

  await notify(revieweeId, {
    type: 'review_added',
    title: 'You received a new review',
    message: `${req.user.name} left you a ${rating}-star review for "${gig.title}"`,
    link: `/users/${revieweeId}`,
  });

  res.status(201).json({ success: true, data: review });
};

/**
 * @desc    Get a user's public (non-flagged) reviews + reputation stats
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getReviewsForUser = async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId, flagged: false })
    .populate('reviewer', 'name profileImage role')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  const criteriaKeys = ['communication', 'quality', 'timeliness', 'professionalism'];
  const breakdown = {};
  criteriaKeys.forEach((key) => {
    const values = reviews.map((r) => r.criteria?.[key]).filter((v) => typeof v === 'number');
    breakdown[key] = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null;
  });

  const user = await User.findById(req.params.userId).select('reputationScore reviewCount');

  res.status(200).json({
    success: true,
    data: reviews,
    stats: {
      reputationScore: user?.reputationScore || 0,
      reviewCount: user?.reviewCount || 0,
      breakdown,
    },
  });
};

/**
 * @desc    Get reviews the logged-in user has written
 * @route   GET /api/reviews/my
 * @access  Private
 */
const getMyReviews = async (req, res) => {
  const reviews = await Review.find({ reviewer: req.user._id })
    .populate('reviewee', 'name profileImage role')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: reviews });
};

module.exports = { createReview, getReviewsForUser, getMyReviews, refreshReputation };
