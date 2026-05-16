const User = require('../models/User');
const Job = require('../models/Job');

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'language'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) updates.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, message: req.t('user.updated'), data: user });
  } catch (err) {
    next(err);
  }
};

exports.saveJob = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = req.params.jobId;

    const idx = user.savedJobs.indexOf(jobId);
    if (idx === -1) {
      user.savedJobs.push(jobId);
    } else {
      user.savedJobs.splice(idx, 1);
    }

    await user.save();
    res.json({ success: true, savedJobs: user.savedJobs });
  } catch (err) {
    next(err);
  }
};

exports.getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('savedJobs');
    res.json({ success: true, data: user.savedJobs });
  } catch (err) {
    next(err);
  }
};

// Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: req.t('user.deleted') });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalJobs] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
    ]);
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const byCategory = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { totalUsers, totalJobs, byRole, byCategory } });
  } catch (err) {
    next(err);
  }
};
