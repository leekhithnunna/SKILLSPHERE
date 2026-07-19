import api from './api';

const userService = {
  searchFreelancers: (params = {}) => api.get('/users', { params }),
  getPublicProfile: (id) => api.get(`/users/${id}`),
  updateFreelancerProfile: (data) => api.put('/users/freelancer-profile', data),
  addPortfolioItem: (formData) =>
    api.post('/users/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removePortfolioItem: (itemId) => api.delete(`/users/portfolio/${itemId}`),
  uploadResume: (formData) =>
    api.post('/users/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default userService;
