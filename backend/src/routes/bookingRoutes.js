const express = require('express');
const router = express.Router();
const { getAvailability, createBooking, getMyBookings, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET /api/bookings/availability/:freelancerId
router.get('/availability/:freelancerId', getAvailability);

// @route   GET /api/bookings/my
router.get('/my', protect, getMyBookings);

// @route   POST /api/bookings
router.post('/', protect, authorizeRoles('client'), createBooking);

// @route   PUT /api/bookings/:id/cancel
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
