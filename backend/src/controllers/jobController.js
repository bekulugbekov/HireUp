const { validationResult } = require('express-validator');
const Job = require('../models/Job');

exports.getJobs = async (req, res, next) => {
  try {
    const { search, category, location, experience, type, minSalary, maxSalary, skills, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (experience) filter.experience = experience;
    if (type) filter.type = type;
    if (minSalary) filter['salary.min'] = { $gte: Number(minSalary) };
    if (maxSalary) filter['salary.max'] = { $lte: Number(maxSalary) };
    if (skills) filter.skills = { $in: skills.split(',').map((s) => s.trim()) };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('createdBy', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      message: req.t('job.fetched'),
      data: jobs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('createdBy', 'fullName email avatar phone telegram');

    if (!job) return res.status(404).json({ success: false, message: req.t('job.notFound') });
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

exports.createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const job = await Job.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: req.t('job.created'), data: job });
  } catch (err) {
    next(err);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: req.t('job.notFound') });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: req.t('job.noPermission') });
    }

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: req.t('job.updated'), data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: req.t('job.notFound') });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: req.t('job.noPermission') });
    }

    await job.deleteOne();
    res.json({ success: true, message: req.t('job.deleted') });
  } catch (err) {
    next(err);
  }
};

exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

exports.toggleJobActive = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: req.t('job.notFound') });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: req.t('job.noPermission') });
    }

    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, message: job.isActive ? req.t('job.activated') : req.t('job.deactivated'), data: job });
  } catch (err) {
    next(err);
  }
};
