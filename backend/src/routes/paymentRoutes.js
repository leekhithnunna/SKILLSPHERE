const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  releasePayment,
  refundPayment,
  getMyPayments,
  getPaymentsForGig,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET /api/payments/my
router.get('/my', protect, getMyPayments);

// @route   GET /api/payments/gig/:gigId
router.get('/gig/:gigId', protect, getPaymentsForGig);

// @route   POST /api/payments/order
router.post('/order', protect, authorizeRoles('client'), createPaymentOrder);

// @route   POST /api/payments/verify
router.post('/verify', protect, authorizeRoles('client'), verifyPayment);

// @route   POST /api/payments/:id/release
router.post('/:id/release', protect, authorizeRoles('client'), releasePayment);

// @route   POST /api/payments/:id/refund
router.post('/:id/refund', protect, authorizeRoles('client'), refundPayment);

module.exports = router;
