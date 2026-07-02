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

module.exports = mongoose.model('Message', MessageSchema);
