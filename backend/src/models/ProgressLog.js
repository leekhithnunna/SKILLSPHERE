const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Progress update message is required'],
      trim: true,
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    attachments: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
  },
  { timestamps: true }
);

progressLogSchema.index({ gig: 1, createdAt: -1 });

module.exports = mongoose.model('ProgressLog', progressLogSchema);
