const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMessages,
  sendMessage,
  markMessagesRead,
} = require('../controllers/messageController');

const markAsRead = markMessagesRead;

router.get('/:applicationId', protect, getMessages);
router.post('/:applicationId', protect, sendMessage);
router.patch('/:applicationId/read', protect, markAsRead);

module.exports = router;
