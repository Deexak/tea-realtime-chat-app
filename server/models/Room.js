const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a room name'],
    trim: true,
    minlength: [3, 'Room name must be at least 3 characters'],
    maxlength: [30, 'Room name cannot exceed 30 characters']
  },
  description: {
    type: String,
    maxlength: [100, 'Description cannot exceed 100 characters'],
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  passcode: {
    type: String,
    select: false
  },
  isDM: {
    type: Boolean,
    default: false
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', RoomSchema);
