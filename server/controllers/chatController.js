const Room = require('../models/Room');

// @desc    Create a new chat room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Check if room name already exists
    const roomExists = await Room.findOne({ name });
    if (roomExists) {
      return res.status(400).json({ message: 'Room with this name already exists' });
    }

    const room = await Room.create({
      name,
      description: description || '',
      creator: req.user.id,
      isPrivate: !!isPrivate
    });

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chat rooms (public and DMs for the user)
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false, isDM: { $ne: true } },
        { isDM: true, members: req.user.id }
      ]
    })
      .populate('creator', 'username email avatar')
      .populate('members', 'username email avatar status')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoomDetails = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('creator', 'username email avatar')
      .populate('members', 'username email avatar status');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create a DM room
// @route   POST /api/rooms/dm
// @access  Private
const getOrCreateDM = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient User ID is required' });
    }

    const myId = req.user.id;

    // Find if DM already exists between these two users
    let room = await Room.findOne({
      isDM: true,
      members: { $all: [myId, recipientId] }
    })
      .populate('creator', 'username email avatar')
      .populate('members', 'username email avatar status');

    if (!room) {
      // Create a new DM room
      room = await Room.create({
        name: `dm_${myId}_${recipientId}`,
        description: 'Direct Message',
        creator: myId,
        isPrivate: true,
        isDM: true,
        members: [myId, recipientId]
      });

      room = await Room.findById(room._id)
        .populate('creator', 'username email avatar')
        .populate('members', 'username email avatar status');
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomDetails,
  getOrCreateDM
};
