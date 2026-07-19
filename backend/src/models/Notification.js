const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'gig_posted',
        'proposal_received',
        'proposal_accepted',
        'proposal_rejected',
        'proposal_negotiated',
        'payment_received',
        'payment_released',
        'review_added',
        'message_received',
        'gig_invite',
        'dispute_opened',
        'dispute_resolved',
        'deadline_reminder',
        'account_verified',
        'gig_approved',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
