const Gig = require('../models/Gig');
const User = require('../models/User');
const { computeSkillSimilarity } = require('../utils/skillSimilarity');

const getFreelancerSkillList = (user) => {
  const proficiencySkills = (user.freelancerProfile?.skillProficiencies || []).map((s) => s.skill);
  return proficiencySkills.length > 0 ? proficiencySkills : user.skills || [];
};

/**
 * @desc    AI-powered freelancer recommendations for a gig — combines skill
 *          similarity, weighted reputation, and hyperlocal proximity
 *          instead of simple filtering
 * @route   GET /api/matching/gigs/:gigId/recommendations
 * @access  Private — gig owner (client) or admin
 */
const getFreelancerRecommendations = async (req, res) => {
  const gig = await Gig.findById(req.params.gigId);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const isOwner = gig.client.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const freelancers = await User.find({ role: 'freelancer', isSuspended: false }).select(
    'name profileImage bio skills freelancerProfile reputationScore reviewCount location'
  );

  const scored = await Promise.all(
    freelancers.map(async (freelancer) => {
      const freelancerSkills = getFreelancerSkillList(freelancer);
      const skillScore = await computeSkillSimilarity(gig.skillsRequired, freelancerSkills);
      const ratingScore = (freelancer.reputationScore || 0) / 5;

      const sameCity =
        gig.location?.city && freelancer.location?.city && gig.location.city === freelancer.location.city;
      const sameCountry =
        gig.location?.country &&
        freelancer.location?.country &&
        gig.location.country === freelancer.location.country;
      const locationScore = sameCity ? 1 : sameCountry ? 0.5 : 0;

      const overallScore = skillScore * 0.6 + ratingScore * 0.25 + locationScore * 0.15;

      return {
        freelancer: {
          _id: freelancer._id,
          name: freelancer.name,
          profileImage: freelancer.profileImage,
          bio: freelancer.bio,
          skills: freelancerSkills,
          reputationScore: freelancer.reputationScore,
          reviewCount: freelancer.reviewCount,
          location: freelancer.location,
          isVerifiedBadge: freelancer.freelancerProfile?.isVerifiedBadge || false,
        },
        skillScore: Math.round(skillScore * 100) / 100,
        ratingScore: Math.round(ratingScore * 100) / 100,
        locationScore,
        overallScore: Math.round(overallScore * 100) / 100,
      };
    })
  );

  const recommendations = scored
    .filter((s) => s.skillScore > 0)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10);

  res.status(200).json({ success: true, data: recommendations });
};

/**
 * @desc    AI-powered "recommended for you" gig list for the logged-in
 *          freelancer, ranked by skill similarity (+ a small recency boost)
 * @route   GET /api/matching/recommended-gigs
 * @access  Private — freelancer
 */
const getRecommendedGigs = async (req, res) => {
  const freelancer = await User.findById(req.user._id);
  const freelancerSkills = getFreelancerSkillList(freelancer);

  if (freelancerSkills.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const openGigs = await Gig.find({ status: 'open' })
    .populate('client', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(100);

  const now = Date.now();
  const scored = await Promise.all(
    openGigs.map(async (gig) => {
      const skillScore = await computeSkillSimilarity(gig.skillsRequired, freelancerSkills);
      const daysOld = (now - new Date(gig.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - daysOld / 30); // linear decay over 30 days

      const overallScore = skillScore * 0.85 + recencyScore * 0.15;

      return { gig, skillScore: Math.round(skillScore * 100) / 100, overallScore: Math.round(overallScore * 100) / 100 };
    })
  );

  const recommendations = scored
    .filter((s) => s.skillScore > 0)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10);

  res.status(200).json({ success: true, data: recommendations });
};

/**
 * @desc    Trending skills across gigs posted in the last 30 days
 * @route   GET /api/matching/trending-skills
 * @access  Public
 */
const getTrendingSkills = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const trending = await Gig.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $unwind: '$skillsRequired' },
    { $group: { _id: { $toLower: '$skillsRequired' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    data: trending.map((t) => ({ skill: t._id, count: t.count })),
  });
};

module.exports = { getFreelancerRecommendations, getRecommendedGigs, getTrendingSkills };
