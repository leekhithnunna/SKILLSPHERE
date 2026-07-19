import api from './api';

const chatService = {
  getConversations: () => api.get('/conversations'),
  getOrCreateConversation: (participantId, gigId) =>
    api.post('/conversations', { participantId, gigId }),
  getMessages: (conversationId, params = {}) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),
  uploadAttachment: (conversationId, formData) =>
    api.post(`/conversations/${conversationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default chatService;
