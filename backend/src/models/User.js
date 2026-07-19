const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      // Not required for Google OAuth accounts (no local password)
      required: function () {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      default: 'client',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpire: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpire: {
      type: Date,
      select: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorOTP: {
      type: String,
      select: false,
    },
    twoFactorOTPExpire: {
      type: Date,
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      // [longitude, latitude] — GeoJSON order
      coordinates: { type: [Number], default: undefined },
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generates a raw email-verification token, stores its SHA-256 hash + a
 * 24h expiry on the document, and returns the raw token (sent via email —
 * only the hash is ever persisted).
 */
userSchema.methods.getEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return rawToken;
};

/**
 * Generates a raw password-reset token, stores its SHA-256 hash + a 1h
 * expiry on the document, and returns the raw token (sent via email).
 */
userSchema.methods.getPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpire = Date.now() + 60 * 60 * 1000;
  return rawToken;
};

/**
 * Generates a 6-digit 2FA OTP, stores it (plain — short-lived, low value)
 * with a 10 minute expiry, and returns it for emailing.
 */
userSchema.methods.getTwoFactorOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.twoFactorOTP = otp;
  this.twoFactorOTPExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

module.exports = mongoose.model('User', userSchema);
