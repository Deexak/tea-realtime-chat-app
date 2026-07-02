const Message = require('../models/Message');

// @desc    Get messages for a specific room
// @route   GET /api/messages/:roomId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 30, before } = req.query;

    const query = { room: roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username email avatar status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// @desc    Send/Save a message
// @route   POST /api/messages
// @access  Private
const createMessage = async (req, res, next) => {
  try {
    const { roomId, content, mediaUrl, mediaType } = req.body;

    if (!roomId || (!content && !mediaUrl)) {
      return res.status(400).json({ message: 'Room ID and message content or media are required' });
    }

    const message = await Message.create({
      sender: req.user.id,
      room: roomId,
      content: content || '',
      mediaUrl,
      mediaType
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email avatar status');

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  createMessage
};
