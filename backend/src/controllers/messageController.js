const Message = require('../models/Message');
const User = require('../models/User');
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

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender'],
          },
        },
      },
      {
        $group: {
          _id: '$otherUser',
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

    await Message.populate(conversations, [
      { path: '_id', model: 'User', select: 'fullName avatar title' },
      { path: 'lastMessage.job', model: 'Job', select: 'title company' },
    ]);

    res.json({ success: true, data: conversations });
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
