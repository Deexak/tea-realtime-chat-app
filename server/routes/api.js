const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { createRoom, getRooms, getRoomDetails, getOrCreateDM, deleteRoom, unlockRoom } = require('../controllers/chatController');
const { createMessage, getMessages } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

// Auth Routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.delete('/auth/account', protect, deleteAccount);

// Room Routes
router.post('/rooms', protect, createRoom);
router.get('/rooms', protect, getRooms);
router.post('/rooms/dm', protect, getOrCreateDM);
router.post('/rooms/:roomId/unlock', protect, unlockRoom);
router.get('/rooms/:roomId', protect, getRoomDetails);
router.delete('/rooms/:roomId', protect, deleteRoom);

const multer = require('multer');
const path = require('path');

// Configure disk storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer file filter limits
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|pdf|zip|txt|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Format not supported! Images, PDFs, Zip and Text files only.'));
  }
});

// Message Routes
router.post('/messages', protect, createMessage);
router.get('/messages/:roomId', protect, getMessages);

// Upload Route
router.post('/upload', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const isImage = /jpeg|jpg|png|gif|webp/.test(path.extname(req.file.originalname).toLowerCase());
    res.json({
      url: fileUrl,
      type: isImage ? 'image' : 'file',
      originalName: req.file.originalname
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
