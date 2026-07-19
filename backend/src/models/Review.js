const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    // Sub-ratings for the "weighted" score and review analytics breakdown
    criteria: {
      communication: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      timeliness: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
    },
    // True because creation is gated on a completed gig with an accepted
    // proposal linking reviewer and reviewee — there is no "unverified"
    // review path in this app, but the flag is kept explicit for clarity
    // and for a future public-review-import feature.
    isVerified: {
      type: Boolean,
      default: true,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One review per direction per gig (client -> freelancer and
// freelancer -> client are both allowed, but not duplicates of the same).
reviewSchema.index({ gig: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
