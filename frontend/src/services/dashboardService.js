import api from './api';

const dashboardService = {
  getClientDashboard: () => api.get('/dashboard/client'),
  getFreelancerDashboard: () => api.get('/dashboard/freelancer'),
  getFreelancerAnalytics: () => api.get('/dashboard/freelancer/analytics'),
};

export default dashboardService;
