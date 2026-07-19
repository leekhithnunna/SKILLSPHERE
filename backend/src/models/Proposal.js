const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
      trim: true,
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid amount must be at least $1'],
    },
    estimatedDays: {
      type: Number,
      required: [true, 'Estimated days is required'],
      min: [1, 'Estimated days must be at least 1'],
    },
    status: {
      type: String,
      enum: ['pending', 'negotiating', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    negotiationHistory: [
      {
        by: { type: String, enum: ['client', 'freelancer'], required: true },
        amount: { type: Number, required: true, min: 1 },
        message: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// One proposal per freelancer per gig
proposalSchema.index({ freelancer: 1, gig: 1 }, { unique: true });

module.exports = mongoose.model('Proposal', proposalSchema);
