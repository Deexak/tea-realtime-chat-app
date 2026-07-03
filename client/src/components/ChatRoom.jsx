import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getRooms, createRoom, getMessages, getOrCreateDM, uploadFile, updateProfile, deleteRoomApi, deleteAccountApi } from '../services/api';
import { 
  LogOut, Plus, Send, Users, Hash, 
  MessageSquare, Menu, X, Smile, Loader2, Paperclip, FileText, Settings, Palette,
  Home, Search, Heart, Edit, ChevronLeft, ChevronDown, Phone, Video, Info, Trash2, Clock
} from 'lucide-react';
import EmojiPicker from './EmojiPicker';


// Web Audio API Typewriter sound synthesizers
const playKeyClick = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 + Math.random() * 600;
    filter.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.035);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (err) {
    console.warn('AudioContext failed:', err);
  }
};

const playCarriageReturn = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2100, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.warn('AudioContext failed:', err);
  }
};

const CHAT_THEMES = {
  obsidian: {
    name: 'Crimson Obsidian',
    bg: '#08080a',
    sidebarBg: 'rgba(10, 10, 14, 0.95)',
    primary: '#ef4444',
    accent: '#dc2626',
    glassBg: 'rgba(8, 8, 10, 0.88)'
  },
  cyberpunk: {
    name: 'Cyber Neon',
    bg: '#08040d',
    sidebarBg: 'rgba(12, 6, 20, 0.95)',
    primary: '#00f0ff',
    accent: '#ff007f',
    glassBg: 'rgba(12, 6, 20, 0.85)'
  },
  mint: {
    name: 'Tokyo Mint',
    bg: '#070a14',
    sidebarBg: 'rgba(8, 12, 22, 0.95)',
    primary: '#05ffd2',
    accent: '#10b981',
    glassBg: 'rgba(8, 12, 22, 0.85)'
  },
  honey: {
    name: 'Spill Honey',
    bg: '#100a08',
    sidebarBg: 'rgba(20, 12, 10, 0.95)',
    primary: '#f59e0b',
    accent: '#d97706',
    glassBg: 'rgba(20, 12, 10, 0.85)'
  },
  lavender: {
    name: 'Vibrant Lavender',
    bg: '#080512',
    sidebarBg: 'rgba(12, 8, 22, 0.95)',
    primary: '#c084fc',
    accent: '#a78bfa',
    glassBg: 'rgba(12, 8, 22, 0.85)'
  }
};

const BUBBLE_STYLES = {
  default: {
    name: 'Theme Default',
    style: {}
  },
  sunset: {
    name: 'Sunset Glow',
    style: {
      background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 12px rgba(255, 8, 68, 0.3)'
    }
  },
  ocean: {
    name: 'Ocean Breeze',
    style: {
      background: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 12px rgba(0, 158, 253, 0.3)'
    }
  },
  magic: {
    name: 'Magic Purple',
    style: {
      background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      color: '#0f172a',
      border: 'none',
      boxShadow: '0 4px 12px rgba(161, 140, 209, 0.3)'
    }
  },
  neon: {
    name: 'Cyber Neon',
    style: {
      background: 'linear-gradient(135deg, #f100ff 0%, #00f0ff 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 12px rgba(0, 240, 255, 0.3)'
    }
  }
};

const getAvatarUrl = (url, username = 'User') => {
  const nameStr = typeof username === 'string' && username.trim() ? username : 'User';
  if (!url || typeof url !== 'string' || url.includes('dicebear.com/7.x') || url.includes('undefined')) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=ef4444&color=ffffff&bold=true&length=2`;
  }
  const API_BASE = import.meta.env.VITE_API_URL || '';
  if (url.startsWith('/uploads')) {
    return `${API_BASE}${url}`;
  }
  return url;
};

const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const API_BASE = import.meta.env.VITE_API_URL || '';
  if (url.startsWith('/uploads')) {
    return `${API_BASE}${url}`;
  }
  return url;
};

const getRecipient = (members, currentUserId) => {
  if (!Array.isArray(members)) return { username: 'User', avatar: '' };
  const found = members.find((m) => {
    if (!m) return false;
    const memberId = typeof m === 'object' ? (m._id || m.id) : m;
    return String(memberId) !== String(currentUserId);
  });
  if (typeof found === 'object' && found !== null) return found;
  return { username: 'User', avatar: '' };
};

const ChatRoom = () => {
  const { user, logout, updateUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  
  // Mobile Viewport height fix
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(`${window.visualViewport.height}px`);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);
  
  // State
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isStriking, setIsStriking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('chat-theme') || 'obsidian');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [selectedBubbleStyle, setSelectedBubbleStyle] = useState('default');
  const [showBubbleStylePicker, setShowBubbleStylePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState('inbox');
  const [activeNavTab, setActiveNavTab] = useState('messages');
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeInboxTab, setActiveInboxTab] = useState('messages');
  const [likedMessages, setLikedMessages] = useState(new Set());
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'like',
      senderName: 'Guest_5177',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest_5177',
      text: 'liked your message: "Welcome to the new chat space!"',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'request',
      senderId: 'demo_user_123',
      senderName: 'Guest_7787',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest_7787',
      text: 'sent you a direct chat request.',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      read: false
    }
  ]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      if (notif.senderId !== user?._id) {
        setNotifications((prev) => [notif, ...prev]);
        playKeyClick();
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user]);

  const handleLikeMessage = (msg) => {
    setLikedMessages((prev) => {
      const updated = new Set(prev);
      if (updated.has(msg._id)) {
        updated.delete(msg._id);
      } else {
        updated.add(msg._id);
        if (socket) {
          socket.emit('send_like', {
            messageId: msg._id,
            roomId: activeRoom?._id,
            targetUserId: msg.sender?._id,
            contentPreview: msg.content
          });
        }
      }
      return updated;
    });
  };

  const handleAcceptRequest = async (senderId) => {
    if (senderId) {
      if (/^[0-9a-fA-F]{24}$/.test(senderId)) {
        try {
          await handleStartDM(senderId);
        } catch (err) {
          console.warn('Failed to start DM for recipient:', senderId);
        }
      } else if (onlineUsers.length > 0) {
        const otherUser = onlineUsers.find((u) => u._id !== user?._id);
        if (otherUser) {
          await handleStartDM(otherUser._id);
        }
      }
    }
    setNotifications((prev) => prev.filter((n) => n.senderId !== senderId && n.id !== senderId));
  };

  const handleDeclineRequest = (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  useEffect(() => {
    localStorage.setItem('chat-theme', theme);
    const selectedTheme = CHAT_THEMES[theme];
    if (selectedTheme) {
      document.documentElement.style.setProperty('--bg-gradient', selectedTheme.bg);
      document.documentElement.style.setProperty('--panel-bg', selectedTheme.sidebarBg);
      document.documentElement.style.setProperty('--glass-bg', selectedTheme.glassBg);
      document.documentElement.style.setProperty('--primary', selectedTheme.primary);
      document.documentElement.style.setProperty('--primary-glow', `${selectedTheme.primary}44`);
      document.documentElement.style.setProperty('--primary-hover', selectedTheme.accent);
      document.documentElement.style.setProperty('--glass-border-focus', `1px solid ${selectedTheme.primary}`);
    }
  }, [theme]);
  
  // New Room Form State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [roomError, setRoomError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [toastError, setToastError] = useState('');

  const triggerToastError = (msg) => {
    setToastError(msg);
    setTimeout(() => setToastError(''), 4000);
  };
  
  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Refs
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const chatFeedRef = useRef(null);
  const profileFileInputRef = useRef(null);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
        if (data.length > 0) {
          // Set first room as active by default
          setActiveRoom(data[0]);
        }
      } catch (err) {
        console.error('Failed to load rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // Handle active room change: fetch messages & join socket room
  useEffect(() => {
    if (!activeRoom || !socket) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      setHasMoreMessages(true);
      try {
        const data = await getMessages(activeRoom._id, { limit: 30 });
        setMessages(data);
        if (data.length < 30) {
          setHasMoreMessages(false);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Socket Room joining
    socket.emit('join_room', { roomId: activeRoom._id });

    // Reset typing states
    setTypingUsers([]);
    if (isTypingRef.current) {
      socket.emit('typing_stop', { roomId: activeRoom._id });
      isTypingRef.current = false;
    }

    return () => {
      socket.emit('leave_room', { roomId: activeRoom._id });
    };
  }, [activeRoom, socket]);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Check if message belongs to active room
      if (activeRoom && message.room === activeRoom._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleUserTypingStart = ({ userId, username }) => {
      if (userId === user._id) return;
      setTypingUsers((prev) => {
        if (prev.find((u) => u.id === userId)) return prev;
        return [...prev, { id: userId, username }];
      });
    };

    const handleUserTypingStop = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleRoomNotification = (noti) => {
      // Handle server notifications if desired (e.g. system message)
      console.log('Room Notification:', noti.text);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing_start', handleUserTypingStart);
    socket.on('user_typing_stop', handleUserTypingStop);
    socket.on('room_notification', handleRoomNotification);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing_start', handleUserTypingStart);
      socket.off('user_typing_stop', handleUserTypingStop);
      socket.off('room_notification', handleRoomNotification);
    };
  }, [socket, activeRoom, user]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleScroll = async () => {
    const container = chatFeedRef.current;
    if (!container || isFetchingOlder || !hasMoreMessages || !activeRoom) return;

    if (container.scrollTop <= 5) {
      setIsFetchingOlder(true);
      const previousScrollHeight = container.scrollHeight;
      const previousScrollTop = container.scrollTop;

      const oldestMessage = messages[0];
      if (!oldestMessage) {
        setIsFetchingOlder(false);
        return;
      }

      try {
        const olderMessages = await getMessages(activeRoom._id, {
          limit: 30,
          before: oldestMessage.createdAt
        });

        if (olderMessages.length < 30) {
          setHasMoreMessages(false);
        }

        if (olderMessages.length > 0) {
          setMessages((prev) => [...olderMessages, ...prev]);

          setTimeout(() => {
            container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
          }, 0);
        }
      } catch (err) {
        console.error('Failed to load older messages:', err);
      } finally {
        setIsFetchingOlder(false);
      }
    }
  };

  // Handle typing key presses
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !activeRoom) return;

    if (!isTypingRef.current && e.target.value.trim() !== '') {
      isTypingRef.current = true;
      socket.emit('typing_start', { roomId: activeRoom._id });
    }

    // Reset typing timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit('typing_stop', { roomId: activeRoom._id });
        isTypingRef.current = false;
      }
    }, 2000); // Stop typing after 2s of inactivity
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !uploadedMedia) || !socket || !activeRoom) return;

    // Clear typing timeout immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      socket.emit('typing_stop', { roomId: activeRoom._id });
      isTypingRef.current = false;
    }

    // Emit event (DB save is handled on backend)
    socket.emit('send_message', {
      roomId: activeRoom._id,
      content: newMessage.trim(),
      mediaUrl: uploadedMedia?.url,
      mediaType: uploadedMedia?.type,
      bubbleStyle: selectedBubbleStyle
    });

    setNewMessage('');
    setUploadedMedia(null);
    setShowEmojiPicker(false);
  };

  // Create room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setRoomError('');
    if (!newRoomName.trim()) {
      setRoomError('Room name is required');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const data = await createRoom({
        name: newRoomName.trim(),
        description: newRoomDesc.trim(),
        isPrivate: false
      });
      
      setRooms((prev) => [data, ...prev]);
      setActiveRoom(data);
      setNewRoomName('');
      setNewRoomDesc('');
      setShowAddRoomModal(false);
    } catch (err) {
      setRoomError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleStartDM = async (recipientId) => {
    try {
      const dmRoom = await getOrCreateDM(recipientId);
      setRooms((prev) => {
        if (prev.find((r) => r._id === dmRoom._id)) return prev;
        return [dmRoom, ...prev];
      });
      setActiveRoom(dmRoom);
    } catch (err) {
      triggerToastError('Could not open direct message channel. Please try again.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await uploadFile(file);
      setUploadedMedia(data); // data is { url, type, originalName }
    } catch (err) {
      triggerToastError('File upload failed. Please choose an image or audio file under 10MB.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await uploadFile(file);
      setTempAvatar(data.url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setIsUploading(false);
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!tempUsername.trim()) {
      setProfileError('Username is required');
      return;
    }

    setIsSavingProfile(true);
    try {
      const data = await updateProfile({
        username: tempUsername.trim(),
        avatar: tempAvatar
      });
      updateUser(data);
      if (socket) {
        socket.emit('update_profile', { username: data.username, avatar: data.avatar });
      }
      setShowSettingsModal(false);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this chat room? All messages in this room will be permanently removed.')) {
      return;
    }
    try {
      await deleteRoomApi(roomId);
      setRooms((prev) => prev.filter((r) => r._id !== roomId));
      setActiveRoom(null);
      triggerToastError('Chat room deleted successfully.');
    } catch (err) {
      triggerToastError('Failed to delete chat room. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to PERMANENTLY delete your account? This action cannot be undone!')) {
      return;
    }
    try {
      await deleteAccountApi();
      logout();
    } catch (err) {
      triggerToastError('Failed to delete account. Please try again.');
    }
  };

  // Utility to format timestamp
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (r.isDM) {
      const recipient = r.members?.find((m) => m._id !== user?._id);
      return recipient?.username?.toLowerCase().includes(q);
    }
    return r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
  });

  const publicRooms = filteredRooms.filter((r) => !r.isDM);
  const dmRooms = filteredRooms.filter((r) => r.isDM);

  return (
    <div className="insta-layout" style={{ height: viewportHeight, maxHeight: viewportHeight }}>
      {/* Toast Error Banner */}
      {toastError && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ef4444',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: '600',
            zIndex: 99999,
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{toastError}</span>
        </div>
      )}

      {/* 1. Leftmost Navigation Rail (Desktop) */}
      <nav className="insta-nav-rail">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <button 
            className="insta-nav-item active" 
            title="Tea Direct"
            onClick={() => {
              setActiveNavTab('home');
              setActiveInboxTab('messages');
              setMobileView('inbox');
              if (publicRooms[0]) setActiveRoom(publicRooms[0]);
            }}
          >
            <Send size={24} style={{ color: 'var(--primary)', transform: 'rotate(-15deg)' }} />
          </button>
          <button 
            className={`insta-nav-item ${activeNavTab === 'home' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('home');
              setActiveInboxTab('messages');
              setMobileView('inbox');
              if (publicRooms[0]) setActiveRoom(publicRooms[0]);
            }}
            title="Home"
          >
            <Home size={22} />
          </button>
          <button 
            className={`insta-nav-item ${activeNavTab === 'messages' ? 'active' : ''}`}
            onClick={() => {
              setActiveNavTab('messages');
              setActiveInboxTab('messages');
              setMobileView('inbox');
            }}
            title="Messages"
          >
            <Send size={22} />
            {onlineUsers.length > 0 && (
              <span className="insta-nav-badge">{onlineUsers.length}</span>
            )}
          </button>
          <button 
            className={`insta-nav-item ${showNotifications ? 'active' : ''}`} 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setActiveInboxTab('requests');
            }}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Heart size={22} style={{ color: notifications.length > 0 ? '#ef4444' : 'inherit' }} />
            {notifications.length > 0 && (
              <span className="insta-nav-badge" style={{ background: '#ef4444' }}>{notifications.length}</span>
            )}
          </button>
          <button 
            className="insta-nav-item" 
            onClick={() => setShowAddRoomModal(true)}
            title="Create Room"
          >
            <Edit size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Theme Switcher Dots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {Object.keys(CHAT_THEMES).map((themeKey) => {
              const t = CHAT_THEMES[themeKey];
              const isSelected = theme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: t.primary,
                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: isSelected ? `0 0 8px ${t.primary}` : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={t.name}
                />
              );
            })}
          </div>

          {/* User Profile Avatar / Settings Button */}
          <button
            onClick={() => {
              setTempUsername(user?.username || '');
              setTempAvatar(user?.avatar || '');
              setProfileError('');
              setShowSettingsModal(true);
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--primary)',
              background: 'none',
              cursor: 'pointer',
              padding: 0
            }}
            title="Profile Settings"
          >
            <img 
              src={getAvatarUrl(user?.avatar, user?.username)} 
              alt={user?.username} 
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </button>
        </div>
      </nav>

      {/* 2. Instagram Mobile Bottom Nav Bar */}
      <nav className="insta-bottom-nav">
        <button 
          className={`insta-nav-item ${activeNavTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            setActiveNavTab('home');
            setActiveInboxTab('messages');
            setMobileView('inbox');
            if (publicRooms[0]) setActiveRoom(publicRooms[0]);
          }}
        >
          <Home size={22} />
        </button>
        <button 
          className={`insta-nav-item ${activeNavTab === 'messages' ? 'active' : ''}`}
          onClick={() => {
            setActiveNavTab('messages');
            setActiveInboxTab('messages');
            setMobileView('inbox');
          }}
        >
          <Send size={22} />
          {onlineUsers.length > 0 && (
            <span className="insta-nav-badge">{onlineUsers.length}</span>
          )}
        </button>
        <button 
          className="insta-nav-item"
          onClick={() => setShowAddRoomModal(true)}
        >
          <Edit size={22} />
        </button>
        <button 
          className={`insta-nav-item ${showNotifications ? 'active' : ''}`}
          onClick={() => {
            setShowNotifications(!showNotifications);
            setActiveInboxTab('requests');
          }}
          style={{ position: 'relative' }}
        >
          <Heart size={22} style={{ color: notifications.length > 0 ? '#ef4444' : 'inherit' }} />
          {notifications.length > 0 && (
            <span className="insta-nav-badge" style={{ background: '#ef4444' }}>{notifications.length}</span>
          )}
        </button>
        <button 
          onClick={() => {
            setTempUsername(user?.username || '');
            setTempAvatar(user?.avatar || '');
            setProfileError('');
            setShowSettingsModal(true);
          }}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1.5px solid var(--primary)',
            background: 'none',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <img 
            src={getAvatarUrl(user?.avatar, user?.username)} 
            alt={user?.username} 
            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </button>
      </nav>

      {/* 3. Inbox Sidebar Panel */}
      <aside 
        className="insta-inbox-sidebar"
        style={{
          display: (mobileView === 'inbox' || (typeof window !== 'undefined' && window.innerWidth >= 769)) ? 'flex' : 'none'
        }}
      >
        {/* Sidebar Header: Instagram Tea Logo, Username & Controls */}
        <div style={{ padding: '16px 20px 8px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="insta-logo-text" style={{ fontSize: '30px', margin: 0, letterSpacing: '0.5px' }}>
              Tea
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => setShowAddRoomModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
                title="Create Room"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={logout}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
              {user?.username}
            </h2>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="insta-search-box">
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="insta-search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Horizontal Notes / Online Avatars Row */}
        <div className="insta-notes-container">
          <div className="insta-notes-scroll">
            {/* User's own note card */}
            <div 
              className="insta-note-card"
              onClick={() => {
                setTempUsername(user?.username || '');
                setTempAvatar(user?.avatar || '');
                setProfileError('');
                setShowSettingsModal(true);
              }}
            >
              <div className="insta-note-bubble">
                Your note...
              </div>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', padding: '2px', border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={getAvatarUrl(user?.avatar, user?.username)} 
                  alt={user?.username} 
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '64px' }}>
                Your note
              </span>
            </div>

            {/* Online users note cards */}
            {onlineUsers.filter(u => u._id !== user?._id).map((onlineUser) => (
              <div 
                key={onlineUser._id}
                className="insta-note-card"
                onClick={() => {
                  handleStartDM(onlineUser._id);
                  setMobileView('chat');
                }}
              >
                <div className="insta-note-bubble">
                  Online 🟢
                </div>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', padding: '2px', border: '2px solid var(--primary)', overflow: 'hidden' }}>
                  <img 
                    src={getAvatarUrl(onlineUser.avatar, onlineUser.username)} 
                    alt={onlineUser.username} 
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(onlineUser.username || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-main)', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '64px' }}>
                  {onlineUser.username}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages / Requests Header Bar */}
        <div style={{ padding: '12px 20px 6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span 
            onClick={() => setActiveInboxTab('messages')}
            style={{ 
              fontSize: '15px', 
              fontWeight: '700', 
              color: activeInboxTab === 'messages' ? 'var(--text-main)' : 'var(--text-muted)', 
              cursor: 'pointer',
              borderBottom: activeInboxTab === 'messages' ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            Messages
          </span>
          <span 
            onClick={() => setActiveInboxTab('requests')}
            style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: activeInboxTab === 'requests' ? 'var(--primary)' : 'var(--text-muted)', 
              cursor: 'pointer',
              borderBottom: activeInboxTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Requests {notifications.filter(n => n.type === 'request').length > 0 && `(${notifications.filter(n => n.type === 'request').length})`}
          </span>
        </div>

        {/* Conversation / Requests List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }} className="sidebar-scroll-container">
          {activeInboxTab === 'requests' ? (
            /* Pending Chat Requests List */
            <div style={{ padding: '8px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', paddingLeft: '8px', display: 'block', marginBottom: '10px' }}>
                Pending Requests ({notifications.filter(n => n.type === 'request').length})
              </span>
              {notifications.filter(n => n.type === 'request').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
                  <Send size={32} style={{ color: 'var(--text-dark)', marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>No pending message requests.</p>
                </div>
              ) : (
                notifications.filter(n => n.type === 'request').map((req) => (
                  <div 
                    key={req.id}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      marginBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--primary)', flexShrink: 0 }}>
                        <img 
                          src={getAvatarUrl(req.senderAvatar, req.senderName)} 
                          alt={req.senderName} 
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.senderName || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                          {req.senderName}
                        </h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {req.text}
                        </p>
                      </div>
                    </div>

                    {/* Accept / Decline Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAcceptRequest(req.senderId)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'var(--primary)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-muted)',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Public Channels & Direct Messages List */
            <>
              {/* Public Channels */}
              {publicRooms.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', paddingLeft: '8px', display: 'block', marginBottom: '6px' }}>
                    Channels
                  </span>
                  {publicRooms.map((room) => {
                    const isActive = activeRoom && activeRoom._id === room._id;
                    return (
                      <button
                        key={room._id}
                        onClick={() => {
                          setActiveRoom(room);
                          setMobileView('chat');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '2px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isActive ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                          <Hash size={20} style={{ color: isActive ? 'var(--primary)' : 'var(--text-main)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: isActive ? '700' : '500', color: 'var(--text-main)', margin: 0 }}>
                            {room.name}
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {room.description || 'Public channel'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Direct Messages */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', paddingLeft: '8px', display: 'block', marginBottom: '6px' }}>
                  Direct Messages
                </span>
                {dmRooms.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-dark)', fontSize: '12px', padding: '16px' }}>
                    No direct messages.
                  </p>
                ) : (
                  dmRooms.map((room) => {
                    const recipient = getRecipient(room.members, user?._id);
                    const isActive = activeRoom && activeRoom._id === room._id;
                    return (
                      <button
                        key={room._id}
                        onClick={() => {
                          setActiveRoom(room);
                          setMobileView('chat');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginBottom: '2px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: isActive ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)' }}>
                          <img 
                            src={getAvatarUrl(recipient.avatar, recipient.username)} 
                            alt={recipient.username} 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.username || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: isActive ? '700' : '500', color: 'var(--text-main)', margin: 0 }}>
                            {recipient.username}
                          </h4>
                          <span style={{ fontSize: '11px', color: recipient.status === 'online' ? 'var(--success)' : 'var(--text-dark)', display: 'block', marginTop: '2px' }}>
                            ● {recipient.status || 'offline'}
                          </span>
                        </div>
                        {recipient.status === 'online' && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 4. Instagram Main Chat Panel */}
      <main 
        className="insta-main-chat"
        style={{
          display: (mobileView === 'chat' || (typeof window !== 'undefined' && window.innerWidth >= 769)) ? 'flex' : 'none'
        }}
      >
        {!activeRoom ? (
          /* Instagram Empty State Screen */
          <div className="insta-empty-state">
            <div className="insta-empty-icon-ring">
              <Send size={42} style={{ color: 'var(--text-main)', transform: 'rotate(-20deg) translateY(-2px)' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>
              Your messages
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Send a message to start a chat.
            </p>
            <button 
              onClick={() => setShowAddRoomModal(true)}
              className="glass-button"
              style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', background: 'var(--primary)', color: '#ffffff' }}
            >
              Send message
            </button>
          </div>
        ) : (
          /* Active Chat Room View */
          <>
            {/* Instagram Active Chat Header */}
            <header 
              style={{
                height: '64px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Back button for mobile navigation */}
                <button
                  onClick={() => setMobileView('inbox')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Room Avatar & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activeRoom.isDM ? (
                    (() => {
                      const recipient = getRecipient(activeRoom.members, user?._id);
                      return (
                        <>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img 
                              src={getAvatarUrl(recipient.avatar, recipient.username)} 
                              alt={recipient.username} 
                              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.username || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>{recipient.username}</h3>
                            <span style={{ fontSize: '11px', color: recipient.status === 'online' ? 'var(--success)' : 'var(--text-dark)' }}>
                              {recipient.status || 'offline'}
                            </span>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Hash size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>{activeRoom.name}</h3>
                        {activeRoom.description && (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{activeRoom.description}</p>
                        )}
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginLeft: '8px' }}>
                    <Clock size={12} style={{ color: 'var(--primary)' }} />
                    <span style={{ whiteSpace: 'nowrap' }}>24h Disappearing</span>
                  </div>
                </div>
              </div>

              {/* Header Right Action Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-main)' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <Phone size={20} />
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <Video size={22} />
                </button>
                <button 
                  onClick={() => handleDeleteRoom(activeRoom._id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Delete Chat Room"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </header>

            {/* Chat Feed Wrapper */}
            <div className="spill-chat-wrapper">
              {/* Messages Container with Infinite Scroll */}
              <div 
                className="spill-chat-feed" 
                ref={chatFeedRef}
                onScroll={handleScroll}
                style={{ flex: 1, overflowY: 'auto', padding: '20px' }}
              >
                {/* Top loader indicator when loading older messages */}
                {isFetchingOlder && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                    <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                )}

                {loadingMessages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender?._id === user?._id;
                    const senderUsername = msg.sender?.username || 'Unknown';

                    return (
                      <div 
                        key={msg._id} 
                        className={`spill-msg-row ${isOwnMessage ? 'own' : ''}`}
                      >
                        <div className="spill-msg-avatar">
                          <img 
                            src={getAvatarUrl(msg.sender?.avatar, senderUsername)} 
                            alt={senderUsername} 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderUsername || 'U')}&background=ef4444&color=ffffff&bold=true`; }}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                          />
                        </div>
                        
                        <div className="spill-msg-col">
                          <span className="spill-msg-username">
                            {isOwnMessage ? 'You' : senderUsername}
                          </span>
                          <div className="spill-msg-bubble" style={BUBBLE_STYLES[msg.bubbleStyle || 'default']?.style}>
                            {msg.mediaUrl && msg.mediaType === 'image' && (
                              <div style={{ marginBottom: msg.content ? '8px' : '0', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px' }}>
                                <img 
                                  src={getMediaUrl(msg.mediaUrl)} 
                                  alt="shared image" 
                                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Image+Unavailable'; }}
                                  style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'contain' }} 
                                />
                              </div>
                            )}
                            {msg.mediaUrl && msg.mediaType === 'file' && (
                              <a 
                                href={msg.mediaUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  padding: '8px 12px', 
                                  background: 'rgba(255,255,255,0.05)', 
                                  borderRadius: '8px',
                                  textDecoration: 'none',
                                  color: 'inherit',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  marginBottom: msg.content ? '8px' : '0'
                                }}
                              >
                                <FileText size={20} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: '13px', wordBreak: 'break-all' }}>
                                  Attachment File
                                </span>
                              </a>
                            )}
                            {msg.content}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span className="spill-msg-time">
                              {formatTime(msg.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLikeMessage(msg)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                color: likedMessages.has(msg._id) ? '#ef4444' : 'var(--text-muted)'
                              }}
                              title="Like message"
                            >
                              <Heart size={13} fill={likedMessages.has(msg._id) ? '#ef4444' : 'none'} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Typing Bubble */}
                {typingUsers.length > 0 && (
                  <div className="spill-msg-row">
                    <div className="spill-msg-avatar">
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Smile size={18} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                    <div className="spill-msg-col">
                      <span className="spill-msg-username">
                        {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </span>
                      <div className="spill-msg-bubble" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px' }}>
                        <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                        <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                        <span className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messageEndRef} />
              </div>

              {/* Custom Emoji Picker Popover */}
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '80px', left: '24px', zIndex: 1000 }}>
                  <EmojiPicker 
                    onSelectEmoji={(emoji) => setNewMessage(prev => prev + emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}

              {/* Custom Bubble Style Picker Popover */}
              {showBubbleStylePicker && (
                <div 
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '24px',
                    width: '260px',
                    padding: '16px',
                    background: 'rgba(8, 8, 10, 0.95)',
                    border: '1px solid rgba(144, 71, 246, 0.25)',
                    borderRadius: '12px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    animation: 'spillMsgFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bubble style</span>
                    <button 
                      type="button" 
                      onClick={() => setShowBubbleStylePicker(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.keys(BUBBLE_STYLES).map((styleKey) => {
                      const s = BUBBLE_STYLES[styleKey];
                      const isSelected = selectedBubbleStyle === styleKey;
                      return (
                        <button
                          key={styleKey}
                          type="button"
                          onClick={() => {
                            setSelectedBubbleStyle(styleKey);
                            setShowBubbleStylePicker(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                            color: 'var(--text-main)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                        >
                          <div 
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '4px',
                              background: s.style.background || 'var(--primary)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }} 
                          />
                          <span>{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Preview Banner */}
              {uploadedMedia && (
                <div 
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: 'var(--primary)' }} />
                    <span>Attached: <strong>{uploadedMedia.originalName}</strong></span>
                  </div>
                  <button 
                    onClick={() => setUploadedMedia(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Quick Emoji Bar */}
              <div 
                style={{
                  padding: '4px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                {['❤️', '🔥', '😂', '👍', '😍', '🚀', '☕', '💯', '✨', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewMessage((prev) => prev + emoji)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                    title={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Input area */}
              <footer className="spill-chat-footer">
                <form onSubmit={handleSendMessage} className="spill-input-wrapper">
                  <button 
                    type="button" 
                    className="spill-input-btn"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowBubbleStylePicker(false);
                    }}
                    style={{ color: showEmojiPicker ? '#9047f6' : 'var(--text-muted)' }}
                    title="Insert Emoji"
                  >
                    <Smile size={20} />
                  </button>
                  <button 
                    type="button" 
                    className="spill-input-btn"
                    onClick={() => {
                      setShowBubbleStylePicker(!showBubbleStylePicker);
                      setShowEmojiPicker(false);
                    }}
                    style={{ color: showBubbleStylePicker ? '#9047f6' : 'var(--text-muted)' }}
                    title="Bubble Style"
                  >
                    <Palette size={20} />
                  </button>
                  <button 
                    type="button" 
                    className="spill-input-btn"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ color: 'var(--text-muted)' }}
                    title="Upload file"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                  <input
                    type="text"
                    className="spill-input"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={handleInputChange}
                  />
                  <button 
                    type="submit" 
                    className="spill-send-btn"
                    disabled={!newMessage.trim() && !uploadedMedia}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </footer>
            </div>
          </>
        )}
      </main>

      {/* CSS overrides inside style tag to keep things neat and modular */}
      <style>{`
        .typing-dot {
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        .typing-dot:nth-child(3) { animation-delay: 0s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        .room-item-hover:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .chat-sidebar-responsive {
            transform: translateX(-100%);
            position: absolute !important;
            width: 280px !important;
          }
          .chat-main-responsive {
            padding-left: 0 !important;
          }
          .hamburger-menu-btn {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .chat-sidebar-responsive {
            transform: translateX(0) !important;
            position: static !important;
          }
          .sidebar-overlay-responsive {
            display: none !important;
          }
        }
      `}</style>

      {/* Add Room Glass Modal */}
      {showAddRoomModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{ 
              width: '100%', 
              maxWidth: '400px', 
              padding: '30px', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Create New Room</h2>
              <button 
                onClick={() => {
                  setShowAddRoomModal(false);
                  setRoomError('');
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {roomError && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                <span>{roomError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="roomName">Room Name</label>
                <input
                  id="roomName"
                  type="text"
                  className="glass-input"
                  placeholder="e.g. general-chat"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  maxLength={30}
                  disabled={isCreatingRoom}
                />
              </div>

              <div className="form-group">
                <label htmlFor="roomDesc">Description (Optional)</label>
                <input
                  id="roomDesc"
                  type="text"
                  className="glass-input"
                  placeholder="What is this room about?"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  maxLength={100}
                  disabled={isCreatingRoom}
                />
              </div>

              <button 
                type="submit" 
                className="glass-button" 
                style={{ width: '100%', marginTop: '10px' }}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showSettingsModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel" 
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(10, 10, 12, 0.92)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Profile Settings</h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Avatar upload display */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    border: '2px solid var(--primary)', 
                    background: 'rgba(255, 255, 255, 0.03)',
                    position: 'relative'
                  }}
                >
                  <img src={tempAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${tempUsername}`} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button
                  type="button"
                  onClick={() => profileFileInputRef.current?.click()}
                  className="glass-button"
                  style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px' }}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
                </button>
                <input 
                  type="file" 
                  ref={profileFileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarUpload}
                  accept="image/*"
                />
              </div>

              {/* Username Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Username</label>
                <input
                  type="text"
                  className="glass-input"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter username"
                  maxLength={20}
                />
              </div>

              {profileError && (
                <p style={{ color: 'var(--accent)', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                  {profileError}
                </p>
              )}

              {/* Save button */}
              <button
                type="submit"
                className="glass-button"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', marginTop: '8px' }}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>

              {/* Delete Account Danger Zone */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Popover Panel */}
      {showNotifications && (
        <div 
          className="glass-panel animate-fade-in"
          style={{
            position: 'fixed',
            left: '72px',
            top: '20px',
            width: '340px',
            maxHeight: '480px',
            zIndex: 1100,
            background: 'rgba(10, 10, 14, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Notifications</h3>
            <button 
              onClick={() => setShowNotifications(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <Heart size={32} style={{ color: 'var(--text-dark)', marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--primary)' }}>
                    <img src={n.senderAvatar} alt={n.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
                      <strong>{n.senderName}</strong> {n.text}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                      {formatTime(n.createdAt)}
                    </span>
                  </div>

                  {n.type === 'like' && (
                    <Heart size={16} fill="#ef4444" style={{ color: '#ef4444', flexShrink: 0 }} />
                  )}

                  {n.type === 'request' && (
                    <button
                      onClick={() => handleAcceptRequest(n.senderId)}
                      style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '600', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      Accept
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
