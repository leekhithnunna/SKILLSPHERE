const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');

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

module.exports = { getClientDashboard, getFreelancerDashboard };
