const User = require('../models/User');
const { uploadBuffer } = require('../utils/uploadFile');

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
  const { name, profileImage, bio, skills, location } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (profileImage !== undefined) updateFields.profileImage = profileImage;
  if (bio !== undefined) updateFields.bio = bio;
  if (skills !== undefined) updateFields.skills = skills;
  if (location !== undefined) updateFields.location = location;

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

/**
 * @desc    Get a freelancer's public profile — increments a profile-view
 *          counter unless the viewer is the profile owner (module 15)
 * @route   GET /api/users/:id
 * @access  Public
 */
const getPublicProfile = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'freelancer') {
    return res.status(404).json({ success: false, message: 'Freelancer not found' });
  }

  const viewerId = req.user?._id?.toString();
  if (viewerId !== user._id.toString()) {
    user.profileViews += 1;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, user });
};

/**
 * @desc    Bulk-update the freelancer professional profile fields
 *          (skills w/ proficiency, certifications, experience, pricing,
 *          weekly availability). File fields (portfolio images, resume)
 *          go through their own endpoints below.
 * @route   PUT /api/users/freelancer-profile
 * @access  Private — freelancer
 */
const updateFreelancerProfile = async (req, res) => {
  const {
    skillProficiencies,
    certifications,
    experience,
    hourlyRate,
    acceptsMilestonePricing,
    weeklyAvailability,
  } = req.body;

  const updateFields = {};
  if (skillProficiencies !== undefined) updateFields['freelancerProfile.skillProficiencies'] = skillProficiencies;
  if (certifications !== undefined) updateFields['freelancerProfile.certifications'] = certifications;
  if (experience !== undefined) updateFields['freelancerProfile.experience'] = experience;
  if (hourlyRate !== undefined) updateFields['freelancerProfile.hourlyRate'] = hourlyRate;
  if (acceptsMilestonePricing !== undefined)
    updateFields['freelancerProfile.acceptsMilestonePricing'] = acceptsMilestonePricing;
  if (weeklyAvailability !== undefined) updateFields['freelancerProfile.weeklyAvailability'] = weeklyAvailability;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, user });
};

/**
 * @desc    Add a portfolio item (with an optional image)
 * @route   POST /api/users/portfolio
 * @access  Private — freelancer
 */
const addPortfolioItem = async (req, res) => {
  const { title, description, projectUrl } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  let imageUrl = '';
  if (req.file) {
    const uploaded = await uploadBuffer(req.file.buffer, {
      folder: 'portfolio',
      filename: req.file.originalname,
      resourceType: 'image',
    });
    imageUrl = uploaded.url;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { 'freelancerProfile.portfolio': { title, description, projectUrl, imageUrl } } },
    { new: true, runValidators: true }
  );

  res.status(201).json({ success: true, user });
};

/**
 * @desc    Remove a portfolio item
 * @route   DELETE /api/users/portfolio/:itemId
 * @access  Private — freelancer
 */
const removePortfolioItem = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { 'freelancerProfile.portfolio': { _id: req.params.itemId } } },
    { new: true }
  );

  res.status(200).json({ success: true, user });
};

/**
 * @desc    Upload/replace resume
 * @route   POST /api/users/resume
 * @access  Private — freelancer
 */
const uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const uploaded = await uploadBuffer(req.file.buffer, {
    folder: 'resumes',
    filename: req.file.originalname,
    resourceType: 'raw',
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'freelancerProfile.resume': { url: uploaded.url, name: req.file.originalname } } },
    { new: true }
  );

  res.status(200).json({ success: true, user });
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  updateFreelancerProfile,
  addPortfolioItem,
  removePortfolioItem,
  uploadResume,
};
