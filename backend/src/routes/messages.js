const router = require('express').Router();
const {
  sendMessage,
  getConversations,
  getMessages,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/', protect, getConversations);
router.get('/unread', protect, getUnreadCount);
router.get('/:userId', protect, getMessages);

module.exports = router;
