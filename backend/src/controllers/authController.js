const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullName, email, password, role, language } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: req.t('auth.emailExists') });
    }

    const user = await User.create({ fullName, email, password, role, language });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: req.t('auth.registered'),
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        language: user.language,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: req.t('auth.invalidCredentials') });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: req.t('auth.loggedIn'),
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        language: user.language,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      language: req.user.language,
      avatar: req.user.avatar,
      phone: req.user.phone,
      telegram: req.user.telegram,
      bio: req.user.bio,
      title: req.user.title,
      savedJobs: req.user.savedJobs,
      createdAt: req.user.createdAt,
    },
  });
};
