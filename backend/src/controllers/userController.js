const User = require('../models/User');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  // Only allow safe fields — prevent email/password/role mutation
  const { name, profileImage, bio, skills } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (profileImage !== undefined) updateFields.profileImage = profileImage;
  if (bio !== undefined) updateFields.bio = bio;
  if (skills !== undefined) updateFields.skills = skills;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
};

module.exports = { getProfile, updateProfile };
