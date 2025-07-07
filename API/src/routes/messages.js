const express = require('express');
const router = express.Router();

const Message = require('../models/messages');

// Lấy tin nhắn giữa 2 người
router.get('/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await Message.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  }).sort({ timestamp: 1 });
  res.json(messages);
});

module.exports = router;
