const Message = require('../models/Message');
const User = require('../models/User');
const Job = require('../models/Job');
const mongoose = require('mongoose');

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, jobId } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: req.t('message.contentRequired') });
    }
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: req.t('message.cannotSelfMessage') });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: req.t('message.userNotFound') });

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      job: jobId || null,
      content: content.trim(),
    });

    await message.populate([
      { path: 'sender', select: 'fullName avatar' },
      { path: 'receiver', select: 'fullName avatar' },
      { path: 'job', select: 'title company' },
    ]);

    res.status(201).json({ success: true, message: req.t('message.sent'), data: message });
  } catch (err) {
    next(err);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Group messages by conversation partner, get latest message per partner
    const conversations = await Message.aggregate([
      {
        $match: { $or: [{ sender: userId }, { receiver: userId }] },
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUserId: {
            $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender'],
          },
        },
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    if (conversations.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Batch fetch partner users and jobs
    const partnerIds = conversations.map((c) => c._id);
    const jobIds = conversations
      .filter((c) => c.lastMessage.job)
      .map((c) => c.lastMessage.job);

    const [partners, jobs] = await Promise.all([
      User.find({ _id: { $in: partnerIds } }).select('fullName avatar title').lean(),
      jobIds.length ? Job.find({ _id: { $in: jobIds } }).select('title company').lean() : Promise.resolve([]),
    ]);

    const partnersMap = Object.fromEntries(partners.map((u) => [u._id.toString(), u]));
    const jobsMap = Object.fromEntries(jobs.map((j) => [j._id.toString(), j]));

    const result = conversations.map((conv) => ({
      partnerId: conv._id.toString(),
      partner: partnersMap[conv._id.toString()] || null,
      unreadCount: conv.unreadCount,
      lastMessage: {
        ...conv.lastMessage,
        job: conv.lastMessage.job ? (jobsMap[conv.lastMessage.job.toString()] || null) : null,
      },
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .populate('sender', 'fullName avatar')
      .populate('receiver', 'fullName avatar')
      .populate('job', 'title company')
      .sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { sender: userId, receiver: myId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};
