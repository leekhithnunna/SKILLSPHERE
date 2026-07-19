import api from './api';

const gigService = {
  getGigs: (params = {}) => api.get('/gigs', { params }),
  getGigById: (id) => api.get(`/gigs/${id}`),
  getMyGigs: () => api.get('/gigs/my'),
  getInvitedGigs: () => api.get('/gigs/invited'),
  createGig: (data) => api.post('/gigs', data),
  updateGig: (id, data) => api.put(`/gigs/${id}`, data),
  deleteGig: (id) => api.delete(`/gigs/${id}`),
  inviteFreelancer: (id, email) => api.post(`/gigs/${id}/invite`, { email }),
  addAttachment: (id, formData) =>
    api.post(`/gigs/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeAttachment: (id, attachmentId) => api.delete(`/gigs/${id}/attachments/${attachmentId}`),
};

export default gigService;
