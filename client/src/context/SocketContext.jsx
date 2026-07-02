import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers([]);
      return;
    }

    const token = localStorage.getItem('token');
    
    // Connect to WebSocket server (using VITE_API_URL or relative proxy)
    const serverUrl = import.meta.env.VITE_API_URL || '/';
    const newSocket = io(serverUrl, {
      auth: { token }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.io connected successfully');
    });

    newSocket.on('initial_online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('user_status_change', ({ userId, username, avatar, status }) => {
      setOnlineUsers((prev) => {
        if (status === 'online') {
          if (prev.find((u) => u._id === userId)) return prev;
          return [...prev, { _id: userId, username, avatar, status }];
        } else {
          return prev.filter((u) => u._id !== userId);
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
