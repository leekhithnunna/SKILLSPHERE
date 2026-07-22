const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// Emails in this list are always granted the admin role when they sign in
// with Google — set via ADMIN_EMAILS in .env (comma-separated).
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * @desc    Log in (or register) with a Google ID token from the frontend's
 *          Google Identity Services button
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
  if (!client) {
    return res.status(501).json({
      success: false,
      message: 'Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID to enable it.',
    });
  }

  const { credential, role } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Missing Google credential' });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Google credential' });
  }

  const { sub: googleId, email, name, picture } = payload;

  const normalizedEmail = email.toLowerCase();
  const isAdminEmail = adminEmails.includes(normalizedEmail);

  let user = await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });

  if (user) {
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }
    let dirty = false;
    if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true; // Google already verified this email
      dirty = true;
    }
    if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
      dirty = true;
    }
    if (dirty) {
      await user.save({ validateBeforeSave: false });
    }
  } else {
    const allowedRoles = ['client', 'freelancer'];
    user = await User.create({
      name,
      email: normalizedEmail,
      googleId,
      role: isAdminEmail ? 'admin' : allowedRoles.includes(role) ? role : 'client',
      isVerified: true,
      profileImage: picture || '',
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
    },
  });
};

module.exports = { googleLogin };
