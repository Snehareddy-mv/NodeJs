import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const channelAPI = {
  getAll: () => api.get('/channels'),
  getById: (id) => api.get(`/channels/${id}`),
  create: (data) => api.post('/channels', data),
  update: (id, data) => api.put(`/channels/${id}`, data),
  delete: (id) => api.delete(`/channels/${id}`),
  addMember: (id, userId) => api.post(`/channels/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/channels/${id}/members/${userId}`),
  createInviteCode: (id) => api.post(`/channels/${id}/invite-code`),
  joinWithCode: (inviteCode) => api.post('/channels/join-with-code', { inviteCode }),
  inviteUser: (id, userId) => api.post(`/channels/${id}/invite`, { userId }),
  acceptInvite: (id) => api.post(`/channels/${id}/accept-invite`),
  promoteModerator: (id, userId) => api.post(`/channels/${id}/promote-moderator`, { userId }),
  promoteAdmin: (id, userId) => api.post(`/channels/${id}/promote-admin`, { userId }),
  demoteUser: (id, userId) => api.post(`/channels/${id}/demote`, { userId }),
};

export const messageAPI = {
  send: (data) => api.post('/messages', data),
  getChannelMessages: (channelId, page = 1, limit = 50) => 
    api.get(`/messages/channel/${channelId}?page=${page}&limit=${limit}`),
  getDirectMessages: (userId, page = 1, limit = 50) => 
    api.get(`/messages/direct/${userId}?page=${page}&limit=${limit}`),
  askAI: (prompt, channelId) => api.post('/messages/ai', { prompt, channelId }),
  summarize: (channelId) => api.get(`/messages/summarize/${channelId}`),
  smartReply: (messageId) => api.get(`/messages/smart-reply/${messageId}`),
  delete: (id) => api.delete(`/messages/${id}`),
  edit: (id, data) => api.put(`/messages/${id}`, data),
  pin: (id) => api.post(`/messages/${id}/pin`),
  unpin: (id) => api.post(`/messages/${id}/unpin`),
  search: (query, channelId, page = 1, limit = 20) => 
    api.get(`/messages/search?query=${query}&channelId=${channelId || ''}&page=${page}&limit=${limit}`),
  getPinned: (channelId) => api.get(`/messages/pinned/${channelId}`),
};

export const userAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/users/all-users?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/users/single-user/${id}`),
  update: (id, data) => api.put(`/users/update-user/${id}`, data),
  delete: (id) => api.delete(`/users/delete-user/${id}`),
  uploadPicture: (formData) => api.post('/users/upload-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
