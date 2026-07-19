import api from './api';

const progressLogService = {
  getProgressLogs: (gigId) => api.get(`/gigs/${gigId}/progress-logs`),
  createProgressLog: (gigId, formData) =>
    api.post(`/gigs/${gigId}/progress-logs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default progressLogService;
