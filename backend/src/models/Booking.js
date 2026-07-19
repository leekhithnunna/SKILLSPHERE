const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      default: null,
    },
    // Stored as a UTC midnight Date representing the calendar day, plus
    // separate HH:mm strings — simplest representation for a single-
    // timezone demo scheduler.
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'startTime must be HH:mm'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'endTime must be HH:mm'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ freelancer: 1, date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
