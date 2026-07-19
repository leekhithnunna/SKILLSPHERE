const Booking = require('../models/Booking');
const User = require('../models/User');
const notify = require('../utils/notify');

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WORKDAY_START_HOUR = 9; // Convention: availability hours/day starts at 09:00

const timeToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const parseDateOnly = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * @desc    Get a freelancer's available hourly slots for a given date,
 *          derived from their weekly availability template (hours/day,
 *          conventionally starting at 09:00) minus existing bookings
 * @route   GET /api/bookings/availability/:freelancerId?date=YYYY-MM-DD
 * @access  Public
 */
const getAvailability = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date query param (YYYY-MM-DD) is required' });
  }

  const freelancer = await User.findOne({ _id: req.params.freelancerId, role: 'freelancer' });
  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' });
  }

  const targetDate = parseDateOnly(date);
  const dayAbbr = DAY_ABBR[targetDate.getUTCDay()];

  const dayAvailability = (freelancer.freelancerProfile?.weeklyAvailability || []).find(
    (a) => a.day === dayAbbr
  );
  const hoursAvailable = dayAvailability?.hours || 0;

  if (hoursAvailable === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const existingBookings = await Booking.find({
    freelancer: freelancer._id,
    date: targetDate,
    status: 'confirmed',
  });

  const slots = [];
  for (let i = 0; i < hoursAvailable; i++) {
    const startHour = WORKDAY_START_HOUR + i;
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const endTime = `${String(startHour + 1).padStart(2, '0')}:00`;
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    const isBooked = existingBookings.some((b) =>
      rangesOverlap(startMin, endMin, timeToMinutes(b.startTime), timeToMinutes(b.endTime))
    );

    slots.push({ startTime, endTime, available: !isBooked });
  }

  res.status(200).json({ success: true, data: slots });
};

/**
 * @desc    Book a freelancer for a time slot. Automatically confirmed if
 *          the slot falls within their availability template and doesn't
 *          conflict with an existing booking — no manual approval step.
 * @route   POST /api/bookings
 * @access  Private — client
 */
const createBooking = async (req, res) => {
  const { freelancerId, gigId, date, startTime, endTime, notes } = req.body;

  if (!freelancerId || !date || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'freelancerId, date, startTime, and endTime are required',
    });
  }

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return res.status(400).json({ success: false, message: 'endTime must be after startTime' });
  }

  const freelancer = await User.findOne({ _id: freelancerId, role: 'freelancer' });
  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found' });
  }

  const targetDate = parseDateOnly(date);
  const dayAbbr = DAY_ABBR[targetDate.getUTCDay()];
  const dayAvailability = (freelancer.freelancerProfile?.weeklyAvailability || []).find(
    (a) => a.day === dayAbbr
  );
  const hoursAvailable = dayAvailability?.hours || 0;

  const windowStart = WORKDAY_START_HOUR * 60;
  const windowEnd = (WORKDAY_START_HOUR + hoursAvailable) * 60;

  if (hoursAvailable === 0 || timeToMinutes(startTime) < windowStart || timeToMinutes(endTime) > windowEnd) {
    return res.status(400).json({
      success: false,
      message: `Freelancer is not available at that time on ${dayAbbr}`,
    });
  }

  const conflict = await Booking.findOne({ freelancer: freelancerId, date: targetDate, status: 'confirmed' });
  if (conflict && rangesOverlap(
    timeToMinutes(startTime),
    timeToMinutes(endTime),
    timeToMinutes(conflict.startTime),
    timeToMinutes(conflict.endTime)
  )) {
    return res.status(400).json({ success: false, message: 'That slot was just booked — please pick another' });
  }

  const booking = await Booking.create({
    freelancer: freelancerId,
    client: req.user._id,
    gig: gigId || null,
    date: targetDate,
    startTime,
    endTime,
    notes: notes || '',
  });

  await notify(
    freelancerId,
    {
      type: 'booking_confirmed',
      title: 'New booking confirmed',
      message: `${req.user.name} booked ${startTime}–${endTime} on ${targetDate.toDateString()}`,
      link: '/scheduler',
    },
    { email: true }
  );

  res.status(201).json({ success: true, data: booking });
};

/**
 * @desc    Get the logged-in user's bookings (as client or freelancer)
 * @route   GET /api/bookings/my
 * @access  Private
 */
const getMyBookings = async (req, res) => {
  const filter =
    req.user.role === 'freelancer' ? { freelancer: req.user._id } : { client: req.user._id };

  const bookings = await Booking.find(filter)
    .populate('client', 'name profileImage')
    .populate('freelancer', 'name profileImage')
    .populate('gig', 'title')
    .sort({ date: 1, startTime: 1 });

  res.status(200).json({ success: true, data: bookings });
};

/**
 * @desc    Cancel a booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private — either party
 */
const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const isParticipant =
    booking.client.toString() === req.user._id.toString() ||
    booking.freelancer.toString() === req.user._id.toString();

  if (!isParticipant) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  booking.status = 'cancelled';
  await booking.save();

  const counterpartId =
    booking.client.toString() === req.user._id.toString() ? booking.freelancer : booking.client;

  await notify(counterpartId, {
    type: 'booking_cancelled',
    title: 'Booking cancelled',
    message: `${req.user.name} cancelled the booking on ${booking.date.toDateString()} at ${booking.startTime}`,
    link: '/scheduler',
  });

  res.status(200).json({ success: true, data: booking });
};

module.exports = { getAvailability, createBooking, getMyBookings, cancelBooking };
