const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  verifyTwoFactor,
  setTwoFactor,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
} = require('../controllers/authController');
const { googleLogin } = require('../controllers/oauthController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
router.post('/register', register);

// @route   GET /api/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// @route   POST /api/auth/resend-verification
router.post('/resend-verification', protect, resendVerification);

// @route   POST /api/auth/login
router.post('/login', login);

// @route   POST /api/auth/verify-2fa
router.post('/verify-2fa', verifyTwoFactor);

// @route   PUT /api/auth/2fa
router.put('/2fa', protect, setTwoFactor);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', resetPassword);

// @route   POST /api/auth/google
router.post('/google', googleLogin);

// @route   POST /api/auth/logout
router.post('/logout', logout);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
