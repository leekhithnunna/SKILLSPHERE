const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

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

  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

  if (user) {
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }
    if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true; // Google already verified this email
      await user.save({ validateBeforeSave: false });
    }
  } else {
    const allowedRoles = ['client', 'freelancer'];
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId,
      role: allowedRoles.includes(role) ? role : 'client',
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
