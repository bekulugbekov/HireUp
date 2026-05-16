const Application = require('../models/Application');
const Job = require('../models/Job');

exports.applyJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: req.t('job.notFound') });

    const existing = await Application.findOne({ user: req.user._id, job: req.params.jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: req.t('application.alreadyApplied') });
    }

    const application = await Application.create({
      user: req.user._id,
      job: req.params.jobId,
      resume: req.file ? req.file.path : req.body.resume,
      coverLetter: req.body.coverLetter,
      phone: req.body.phone || '',
      telegram: req.body.telegram || '',
    });

    res.status(201).json({ success: true, message: req.t('application.submitted'), data: application });
  } catch (err) {
    next(err);
  }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('job', 'title company location salary type contact')
      .sort({ createdAt: -1 });
    res.json({ success: true, message: req.t('application.fetched'), data: applications });
  } catch (err) {
    next(err);
  }
};

exports.getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: req.t('job.notFound') });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: req.t('auth.forbidden') });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('user', 'fullName email avatar phone telegram')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, message: req.t('application.notFound') });
    res.json({ success: true, message: req.t('application.updated'), data: application });
  } catch (err) {
    next(err);
  }
};

exports.withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!application) return res.status(404).json({ success: false, message: req.t('application.notFound') });

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: req.t('application.cannotWithdraw') });
    }

    await application.deleteOne();
    res.json({ success: true, message: req.t('application.withdrawn') });
  } catch (err) {
    next(err);
  }
};
