import api from './api';

const gigService = {
  getGigs: (params = {}) => api.get('/gigs', { params }),
  getGigById: (id) => api.get(`/gigs/${id}`),
  getMyGigs: () => api.get('/gigs/my'),
  createGig: (data) => api.post('/gigs', data),
  updateGig: (id, data) => api.put(`/gigs/${id}`, data),
  deleteGig: (id) => api.delete(`/gigs/${id}`),
};

export default gigService;
