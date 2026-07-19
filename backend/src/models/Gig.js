const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Milestone title is required'], trim: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: [true, 'Milestone amount is required'], min: [1, 'Milestone amount must be at least $1'] },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'approved'],
      default: 'pending',
    },
    completionNote: { type: String, default: '' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const gigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Gig title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Gig description is required'],
      trim: true,
    },
    budgetMin: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [1, 'Minimum budget must be at least $1'],
    },
    budgetMax: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      min: [1, 'Maximum budget must be at least $1'],
      validate: {
        validator: function (value) {
          return value >= this.budgetMin;
        },
        message: 'Maximum budget must be greater than or equal to minimum budget',
      },
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'closed'],
      default: 'open',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    attachments: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
    invitedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Set by an admin (module 9) — gigs can be created directly as 'open'
    // today, but admin approval will gate visibility once that module lands.
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text index for search
gigSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
