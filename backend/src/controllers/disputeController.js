const Dispute = require('../models/Dispute');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const notify = require('../utils/notify');
const logAdminAction = require('../utils/logAdminAction');
const { uploadBuffer } = require('../utils/uploadFile');

/**
 * @desc    Raise a dispute against the other party on a gig
 * @route   POST /api/disputes
 * @access  Private — the gig's client or accepted freelancer
 */
const createDispute = async (req, res) => {
  const { gigId, paymentId, reason, description } = req.body;

  if (!gigId || !reason) {
    return res.status(400).json({ success: false, message: 'gigId and reason are required' });
  }

  const gig = await Gig.findById(gigId);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  const acceptedProposal = await Proposal.findOne({ gig: gigId, status: 'accepted' });
  if (!acceptedProposal) {
    return res.status(400).json({ success: false, message: 'This gig has no active working relationship to dispute' });
  }

  const userId = req.user._id.toString();
  const clientId = gig.client.toString();
  const freelancerId = acceptedProposal.freelancer.toString();

  if (userId !== clientId && userId !== freelancerId) {
    return res.status(403).json({ success: false, message: 'Not authorized to raise a dispute on this gig' });
  }

  const against = userId === clientId ? freelancerId : clientId;

  const dispute = await Dispute.create({
    gig: gigId,
    payment: paymentId || null,
    raisedBy: req.user._id,
    against,
    reason,
    description: description || '',
  });

  await notify(
    against,
    {
      type: 'dispute_opened',
      title: 'A dispute was opened against you',
      message: `${req.user.name} raised a dispute on "${gig.title}": ${reason}`,
      link: `/disputes/${dispute._id}`,
    },
    { email: true }
  );

  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(
    admins.map((admin) =>
      notify(admin._id, {
        type: 'dispute_opened',
        title: 'New dispute needs mediation',
        message: `${req.user.name} raised a dispute on "${gig.title}": ${reason}`,
        link: `/admin/disputes`,
      })
    )
  );

  res.status(201).json({ success: true, data: dispute });
};

/**
 * @desc    Upload evidence to a dispute
 * @route   POST /api/disputes/:id/evidence
 * @access  Private — either party to the dispute
 */
const addEvidence = async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    return res.status(404).json({ success: false, message: 'Dispute not found' });
  }

  const userId = req.user._id.toString();
  if (dispute.raisedBy.toString() !== userId && dispute.against.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploaded = await uploadBuffer(req.file.buffer, {
    folder: 'disputes',
    filename: req.file.originalname,
    resourceType: 'auto',
  });

  dispute.evidence.push({ url: uploaded.url, name: req.file.originalname, type: req.file.mimetype });
  await dispute.save();

  res.status(201).json({ success: true, data: dispute });
};

/**
 * @desc    Get disputes involving the logged-in user
 * @route   GET /api/disputes/my
 * @access  Private
 */
const getMyDisputes = async (req, res) => {
  const disputes = await Dispute.find({ $or: [{ raisedBy: req.user._id }, { against: req.user._id }] })
    .populate('gig', 'title')
    .populate('raisedBy', 'name')
    .populate('against', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: disputes });
};

/**
 * @desc    Get a single dispute (either party or an admin)
 * @route   GET /api/disputes/:id
 * @access  Private
 */
const getDisputeById = async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('gig', 'title')
    .populate('raisedBy', 'name email')
    .populate('against', 'name email')
    .populate('resolvedBy', 'name');

  if (!dispute) {
    return res.status(404).json({ success: false, message: 'Dispute not found' });
  }

  const userId = req.user._id.toString();
  const isParticipant = dispute.raisedBy._id.toString() === userId || dispute.against._id.toString() === userId;
  if (!isParticipant && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: dispute });
};

/**
 * @desc    List all disputes (admin mediation queue)
 * @route   GET /api/admin/disputes
 * @access  Private — admin
 */
const getAllDisputes = async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const disputes = await Dispute.find(query)
    .populate('gig', 'title')
    .populate('raisedBy', 'name email')
    .populate('against', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: disputes });
};

/**
 * @desc    Admin resolves (or rejects) a dispute
 * @route   PUT /api/admin/disputes/:id/resolve
 * @access  Private — admin
 */
const resolveDispute = async (req, res) => {
  const { status, resolution } = req.body;

  if (!['resolved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'status must be "resolved" or "rejected"' });
  }

  const dispute = await Dispute.findById(req.params.id).populate('gig', 'title');
  if (!dispute) {
    return res.status(404).json({ success: false, message: 'Dispute not found' });
  }

  dispute.status = status;
  dispute.resolution = resolution || '';
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  await logAdminAction(req.user._id, `dispute_${status}`, 'Dispute', dispute._id, { resolution });

  for (const partyId of [dispute.raisedBy, dispute.against]) {
    await notify(
      partyId,
      {
        type: 'dispute_resolved',
        title: 'Dispute resolved',
        message: `Your dispute on "${dispute.gig.title}" was ${status}. ${resolution || ''}`.trim(),
        link: `/disputes/${dispute._id}`,
      },
      { email: true }
    );
  }

  res.status(200).json({ success: true, data: dispute });
};

module.exports = {
  createDispute,
  addEvidence,
  getMyDisputes,
  getDisputeById,
  getAllDisputes,
  resolveDispute,
};
