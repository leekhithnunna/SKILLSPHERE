const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  profileImage: user.profileImage,
  bio: user.bio,
  skills: user.skills,
  location: user.location,
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check for existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Determine role — default to 'client' if invalid value provided
  const allowedRoles = ['client', 'freelancer', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'client';

  // Create user (password is hashed via pre-save hook in User model)
  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  const rawToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your SkillSphere email',
      html: `<p>Hi ${user.name},</p><p>Welcome to SkillSphere! Please verify your email address:</p><p><a href="${CLIENT_URL}/verify-email/${rawToken}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
    });
  } catch (err) {
    console.error('[auth] Failed to send verification email:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email to verify your account.',
  });
};

/**
 * @desc    Verify email via emailed token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpire');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Verification link is invalid or has expired',
    });
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
};

/**
 * @desc    Resend the email verification link
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerification = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email is already verified' });
  }

  const rawToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    subject: 'Verify your SkillSphere email',
    html: `<p>Hi ${user.name},</p><p><a href="${CLIENT_URL}/verify-email/${rawToken}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
  });

  res.status(200).json({ success: true, message: 'Verification email sent' });
};

/**
 * @desc    Login user and return JWT (or trigger 2FA challenge)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Find user (include password for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  if (user.isSuspended) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended. Contact support for assistance.',
    });
  }

  if (user.twoFactorEnabled) {
    const otp = user.getTwoFactorOTP();
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your SkillSphere login code',
        html: `<p>Your one-time login code is:</p><h2>${otp}</h2><p>It expires in 10 minutes.</p>`,
      });
    } catch (err) {
      console.error('[auth] Failed to send 2FA email:', err.message);
    }

    return res.status(200).json({
      success: true,
      twoFactorRequired: true,
      userId: user._id,
      message: 'A one-time code has been sent to your email',
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: publicUser(user),
  });
};

/**
 * @desc    Verify the 2FA OTP and complete login
 * @route   POST /api/auth/verify-2fa
 * @access  Public
 */
const verifyTwoFactor = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: 'userId and otp are required' });
  }

  const user = await User.findById(userId).select('+twoFactorOTP +twoFactorOTPExpire');

  if (
    !user ||
    !user.twoFactorOTP ||
    user.twoFactorOTP !== otp ||
    user.twoFactorOTPExpire < Date.now()
  ) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }

  user.twoFactorOTP = undefined;
  user.twoFactorOTPExpire = undefined;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: publicUser(user),
  });
};

/**
 * @desc    Enable/disable 2FA for the logged-in user
 * @route   PUT /api/auth/2fa
 * @access  Private
 */
const setTwoFactor = async (req, res) => {
  const { enabled } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { twoFactorEnabled: Boolean(enabled) },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: `Two-factor authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}`,
    user: publicUser(user),
  });
};

/**
 * @desc    Request a password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always respond with success to avoid leaking which emails are registered
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset link has been sent',
    });
  }

  const rawToken = user.getPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your SkillSphere password',
      html: `<p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${CLIENT_URL}/reset-password/${rawToken}">Reset Password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Failed to send reset email' });
  }

  res.status(200).json({
    success: true,
    message: 'If that email is registered, a reset link has been sent',
  });
};

/**
 * @desc    Reset password using the emailed token
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpire');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Reset link is invalid or has expired',
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
};

/**
 * @desc    Logout user (clear cookie if used)
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  res.clearCookie('token');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  // req.user is attached by the protect middleware
  const user = req.user;

  res.status(200).json({
    success: true,
    user,
  });
};

module.exports = {
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
};
