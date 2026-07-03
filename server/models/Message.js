const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  mediaUrl: {
    type: String
  },
  mediaType: {
    type: String
  },
  bubbleStyle: {
    type: String,
    default: 'default'
  }
}, {
  timestamps: true
});

// Automatically delete messages after 24 hours (86400 seconds)
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Message', MessageSchema);
