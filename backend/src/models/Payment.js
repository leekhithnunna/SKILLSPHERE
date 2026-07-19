const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    milestoneId: {
      // References Gig.milestones[]._id — null means a single full-gig payment
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['created', 'escrow', 'released', 'refunded', 'failed'],
      default: 'created',
    },
    isMock: {
      type: Boolean,
      default: false,
    },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ gig: 1, milestoneId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
