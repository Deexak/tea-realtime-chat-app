const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config();

const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');
const { protectSocket } = require('./middlewares/authMiddleware');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// Mount API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Real-Time Chat API is running...' });
});

// Error Handler Middleware (must be mounted after routes)
app.use(errorHandler);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific frontend URL
    methods: ['GET', 'POST']
  }
});

// Use Socket auth middleware
io.use(protectSocket);

// In-memory tracker for online users (userId -> Set of socketIds)
const onlineUsers = new Map();

io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();
  const username = socket.user.username;

  console.log(`User connected: ${username} (${userId}) - Socket: ${socket.id}`);

  // Track socket ID
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // If this is the first socket for this user, mark them online in DB and broadcast
  if (onlineUsers.get(userId).size === 1) {
    try {
      await User.findByIdAndUpdate(userId, { status: 'online' });
      io.emit('user_status_change', {
        userId,
        username,
        avatar: socket.user.avatar,
        status: 'online'
      });
    } catch (err) {
      console.error(`Error updating online status for ${username}:`, err);
    }
  }

  // Send the list of current online user profiles to the newly connected client
  try {
    const onlineUserProfiles = await User.find(
      { _id: { $in: Array.from(onlineUsers.keys()) } },
      'username avatar status'
    );
    socket.emit('initial_online_users', onlineUserProfiles);
  } catch (err) {
    console.error('Error fetching online user profiles:', err);
    socket.emit('initial_online_users', Array.from(onlineUsers.keys()).map(id => ({ _id: id, username: 'User', status: 'online' })));
  }

  // Join Room Event
  socket.on('join_room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`User ${username} joined room: ${roomId}`);
    // Notify room members
    socket.to(roomId).emit('room_notification', {
      text: `${username} has joined the room.`
    });
  });

  // Leave Room Event
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    console.log(`User ${username} left room: ${roomId}`);
    // Notify room members
    socket.to(roomId).emit('room_notification', {
      text: `${username} has left the room.`
    });
  });

  // Send Message Event
  socket.on('send_message', async ({ roomId, content, mediaUrl, mediaType, bubbleStyle }) => {
    try {
      if ((!content || !content.trim()) && !mediaUrl) return;

      // Save message to DB
      const message = await Message.create({
        sender: userId,
        room: roomId,
        content: content ? content.trim() : '',
        mediaUrl,
        mediaType,
        bubbleStyle: bubbleStyle || 'default'
      });

      // Populate sender before emitting
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username email avatar status');

      // Emit to all users in the room
      io.to(roomId).emit('new_message', populatedMessage);
    } catch (err) {
      console.error('Error saving message in socket:', err);
      socket.emit('error_notification', { message: 'Failed to send message.' });
    }
  });

  // Typing Indicators
  socket.on('typing_start', ({ roomId }) => {
    socket.to(roomId).emit('user_typing_start', {
      userId,
      username
    });
  });

  socket.on('typing_stop', ({ roomId }) => {
    socket.to(roomId).emit('user_typing_stop', {
      userId,
      username
    });
  });

  // Disconnect Event
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${username} (${userId}) - Socket: ${socket.id}`);
    
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      
      // If user has no active sockets remaining
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        try {
          await User.findByIdAndUpdate(userId, { status: 'offline' });
          io.emit('user_status_change', {
            userId,
            username,
            avatar: socket.user.avatar,
            status: 'offline'
          });
        } catch (err) {
          console.error(`Error updating offline status for ${username}:`, err);
        }
      }
    }
  });

  // Profile update socket event
  socket.on('update_profile', async ({ username, avatar }) => {
    try {
      const updatedUser = await User.findById(userId, 'username avatar status');
      if (updatedUser) {
        io.emit('user_status_change', {
          userId,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          status: updatedUser.status
        });
      }
    } catch (err) {
      console.error('Error broadcasting profile update:', err);
    }
  });

  // Like Message Socket Event
  socket.on('send_like', ({ messageId, roomId, targetUserId, contentPreview }) => {
    try {
      io.emit('new_notification', {
        id: Date.now().toString(),
        type: 'like',
        senderId: userId,
        senderName: username,
        senderAvatar: socket.user.avatar,
        targetUserId,
        roomId,
        messageId,
        contentPreview,
        text: `${username} liked your message: "${contentPreview ? contentPreview.substring(0, 25) + '...' : 'media'}"`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in send_like socket event:', err);
    }
  });

  // Send Chat Request Socket Event
  socket.on('send_request', ({ targetUserId }) => {
    try {
      io.emit('new_notification', {
        id: Date.now().toString(),
        type: 'request',
        senderId: userId,
        senderName: username,
        senderAvatar: socket.user.avatar,
        targetUserId,
        text: `${username} sent you a chat request.`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error in send_request socket event:', err);
    }
  });
});

// Serve static React client assets in Production mode
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Database Connection & Server Listening
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB connected successfully.');
    
    // Start listening only after DB connection
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('========================================================');
    console.error('DATABASE CONNECTION ERROR:');
    console.error(error.message);
    console.error('--------------------------------------------------------');
    console.error('Please verify that MongoDB is installed and running locally.');
    console.error('Or provide a valid MONGODB_URI in backend/server/.env');
    console.error('========================================================');
    
    // Fallback: Still start server but output warnings so application doesn't crash
    console.warn('Starting Express/Socket server in OFFLINE mode (API/DB operations will fail)...');
    server.listen(PORT, () => {
      console.log(`Server running in OFFLINE mode on port ${PORT}`);
    });
  }
};

connectDB();
