import api from './api';

const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getLogs: () => api.get('/admin/logs'),

  getUsers: (params = {}) => api.get('/admin/users', { params }),
  suspendUser: (id, suspended) => api.put(`/admin/users/${id}/suspend`, { suspended }),
  verifyFreelancer: (id) => api.put(`/admin/users/${id}/verify-freelancer`),

  getGigs: (params = {}) => api.get('/admin/gigs', { params }),
  approveGig: (id, approved = true) => api.put(`/admin/gigs/${id}/approve`, { approved }),

  getPayments: (params = {}) => api.get('/admin/payments', { params }),
  getFlaggedReviews: () => api.get('/admin/reviews/flagged'),
};

export default adminService;
