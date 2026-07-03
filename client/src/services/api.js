import axios from 'axios';

// Configure default axios instance
const API_BASE = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor to attach JWT token to outgoing HTTP requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Room API Methods
export const getRooms = async () => {
  const response = await api.get('/api/rooms');
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/api/rooms', roomData);
  return response.data;
};

export const getRoomDetails = async (roomId) => {
  const response = await api.get(`/api/rooms/${roomId}`);
  return response.data;
};

export const getOrCreateDM = async (recipientId) => {
  const response = await api.post('/api/rooms/dm', { recipientId });
  return response.data;
};

// Message API Methods
export const getMessages = async (roomId, options = {}) => {
  const { limit, before } = options;
  const params = {};
  if (limit) params.limit = limit;
  if (before) params.before = before;

  const response = await api.get(`/api/messages/${roomId}`, { params });
  return response.data;
};

export const sendMessage = async (messageData) => {
  const response = await api.post('/api/messages', messageData);
  return response.data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteRoomApi = async (roomId) => {
  const response = await api.delete(`/api/rooms/${roomId}`);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/api/auth/profile', profileData);
  return response.data;
};

export const deleteAccountApi = async () => {
  const response = await api.delete('/api/auth/account');
  return response.data;
};

export default api;
