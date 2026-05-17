import api from './api';

export const messageService = {
  send: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  getUnreadCount: () => api.get('/messages/unread'),
};
