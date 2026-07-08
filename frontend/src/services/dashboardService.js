import api from './api';

const dashboardService = {
  getClientDashboard: () => api.get('/dashboard/client'),
  getFreelancerDashboard: () => api.get('/dashboard/freelancer'),
};

export default dashboardService;
