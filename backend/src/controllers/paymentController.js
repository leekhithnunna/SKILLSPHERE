const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const notify = require('../utils/notify');
const { createOrder, verifyPaymentSignature, refundPayment, isConfigured } = require('../config/razorpay');
const { recomputeMilestoneProgress } = require('../utils/gigProgress');

/**
 * @desc    Create a Razorpay order to fund escrow for a gig or a single
 *          milestone
 * @route   POST /api/payments/order
 * @access  Private — client (gig owner)
 */
const createPaymentOrder = async (req, res) => {
  const { gigId, milestoneId } = req.body;

  if (!gigId) {
    return res.status(400).json({ success: false, message: 'gigId is required' });
  }

  const gig = await Gig.findById(gigId);
  if (!gig) {
    return res.status(404).json({ success: false, message: 'Gig not found' });
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to pay for this gig' });
  }

  const acceptedProposal = await Proposal.findOne({ gig: gigId, status: 'accepted' });
  if (!acceptedProposal) {
    return res.status(400).json({ success: false, message: 'This gig has no accepted freelancer to pay' });
  }

  let amount;
  if (milestoneId) {
    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }
    amount = milestone.amount;
  } else {
    amount = acceptedProposal.bidAmount || gig.budgetMax;
  }

  // Only a funded (escrow) or completed (released) payment should block a
  // new attempt. A payment stuck in "created" means an earlier checkout was
  // abandoned before verifyPayment ran (modal closed, network error, etc.)
  // and must never permanently block paying for this gig/milestone.
  const blockingPayment = await Payment.findOne({
    gig: gigId,
    milestoneId: milestoneId || null,
    status: { $in: ['escrow', 'released'] },
  });
  if (blockingPayment) {
    return res.status(400).json({
      success: false,
      message: `This ${milestoneId ? 'milestone' : 'gig'} already has a payment in progress or completed`,
    });
  }

  // Supersede any abandoned "created" orders for this gig/milestone so
  // payments never pile up in a stuck, unpayable state.
  await Payment.updateMany(
    { gig: gigId, milestoneId: milestoneId || null, status: 'created' },
    { $set: { status: 'failed' } }
  );

  const { orderId, isMock } = await createOrder({
    amount,
    currency: 'USD',
    receipt: `gig_${gigId}_${milestoneId || 'full'}`,
  });

  const payment = await Payment.create({
    gig: gigId,
    milestoneId: milestoneId || null,
    client: req.user._id,
    freelancer: acceptedProposal.freelancer,
    amount,
    razorpayOrderId: orderId,
    isMock,
  });

  res.status(201).json({
    success: true,
    data: {
      paymentId: payment._id,
      orderId,
      amount,
      currency: 'USD',
      keyId: isConfigured ? process.env.RAZORPAY_KEY_ID : null,
      isMock,
    },
  });
};

/**
 * @desc    Verify a completed Razorpay checkout and move funds into escrow
 * @route   POST /api/payments/verify
 * @access  Private — client (payment owner)
 */
const verifyPayment = async (req, res) => {
  const { paymentId, razorpayPaymentId, razorpaySignature } = req.body;

  const payment = await Payment.findById(paymentId).populate('gig', 'title milestones');
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (payment.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (payment.status !== 'created') {
    return res.status(400).json({ success: false, message: 'Payment already processed' });
  }

  const isValid = payment.isMock
    ? true
    : verifyPaymentSignature({
        orderId: payment.razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

  if (!isValid) {
    payment.status = 'failed';
    await payment.save();
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
  }

  payment.status = 'escrow';
  payment.razorpayPaymentId = razorpayPaymentId || `mock_pay_${payment._id}`;
  await payment.save();

  if (payment.milestoneId) {
    const gigDoc = await Gig.findById(payment.gig._id);
    const milestone = gigDoc.milestones.id(payment.milestoneId);
    if (milestone && milestone.status === 'pending') {
      milestone.status = 'in-progress';
      await gigDoc.save();
    }
  }

  await notify(
    payment.freelancer,
    {
      type: 'payment_received',
      title: 'Escrow funded',
      message: `The client funded escrow for $${payment.amount} on "${payment.gig.title}"`,
      link: `/gigs/${payment.gig._id}`,
    },
    { email: true }
  );

  res.status(200).json({ success: true, data: payment });
};

/**
 * @desc    Release escrowed funds to the freelancer (simulates an
 *          automatic freelancer payout — real payouts require a separate
 *          KYC'd RazorpayX account, out of scope here)
 * @route   POST /api/payments/:id/release
 * @access  Private — client (payment owner)
 */
const releasePayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('gig', 'title');
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (payment.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (payment.status !== 'escrow') {
    return res.status(400).json({ success: false, message: 'Only escrowed payments can be released' });
  }

  payment.status = 'released';
  payment.releasedAt = new Date();
  await payment.save();

  if (payment.milestoneId) {
    const gigDoc = await Gig.findById(payment.gig._id);
    const milestone = gigDoc.milestones.id(payment.milestoneId);
    if (milestone) {
      milestone.status = 'approved';
      await gigDoc.save();
      await recomputeMilestoneProgress(gigDoc);
    }
  }

  await notify(
    payment.freelancer,
    {
      type: 'payment_released',
      title: 'Payment released',
      message: `$${payment.amount} was released to you for "${payment.gig.title}"`,
      link: `/gigs/${payment.gig._id}`,
    },
    { email: true }
  );

  res.status(200).json({ success: true, data: payment });
};

/**
 * @desc    Refund an escrowed (not yet released) payment
 * @route   POST /api/payments/:id/refund
 * @access  Private — client (payment owner)
 */
const refundPaymentHandler = async (req, res) => {
  const { reason } = req.body;

  const payment = await Payment.findById(req.params.id).populate('gig', 'title');
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (payment.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (payment.status !== 'escrow') {
    return res.status(400).json({
      success: false,
      message: 'Only escrowed (not yet released) payments can be refunded',
    });
  }

  await refundPayment({ paymentId: payment.razorpayPaymentId, amount: payment.amount });

  payment.status = 'refunded';
  payment.refundedAt = new Date();
  payment.refundReason = reason || '';
  await payment.save();

  await notify(payment.freelancer, {
    type: 'payment_received',
    title: 'Payment refunded',
    message: `The escrowed $${payment.amount} for "${payment.gig.title}" was refunded to the client`,
    link: `/gigs/${payment.gig._id}`,
  });

  res.status(200).json({ success: true, data: payment });
};

/**
 * @desc    Get all payments for a specific gig (its client or freelancer only)
 * @route   GET /api/payments/gig/:gigId
 * @access  Private — gig client or accepted freelancer
 */
const getPaymentsForGig = async (req, res) => {
  const payments = await Payment.find({ gig: req.params.gigId }).sort({ createdAt: -1 });

  const isParticipant = payments.some(
    (p) =>
      p.client.toString() === req.user._id.toString() || p.freelancer.toString() === req.user._id.toString()
  );

  // Even with zero payments yet, allow the gig's client through so the
  // frontend can render "Pay" buttons — verify via the gig itself.
  if (payments.length > 0 && !isParticipant) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (payments.length === 0) {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig || gig.client.toString() !== req.user._id.toString()) {
      const acceptedProposal = await Proposal.findOne({ gig: req.params.gigId, status: 'accepted' });
      if (!acceptedProposal || acceptedProposal.freelancer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
  }

  res.status(200).json({ success: true, data: payments });
};

/**
 * @desc    Transaction history for the logged-in user (client or freelancer)
 * @route   GET /api/payments/my
 * @access  Private
 */
const getMyPayments = async (req, res) => {
  const filter =
    req.user.role === 'freelancer' ? { freelancer: req.user._id } : { client: req.user._id };

  const payments = await Payment.find(filter)
    .populate('gig', 'title')
    .populate('client', 'name')
    .populate('freelancer', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: payments });
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  releasePayment,
  refundPayment: refundPaymentHandler,
  getMyPayments,
  getPaymentsForGig,
};
