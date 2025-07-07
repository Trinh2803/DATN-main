const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true }, // 'client' hoặc 'admin'
  to: { type: String, required: true },   // 'client' hoặc 'admin'
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);