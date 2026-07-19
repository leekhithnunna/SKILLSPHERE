import api from './api';

const disputeService = {
  createDispute: (data) => api.post('/disputes', data),
  addEvidence: (id, formData) =>
    api.post(`/disputes/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyDisputes: () => api.get('/disputes/my'),
  getDisputeById: (id) => api.get(`/disputes/${id}`),
};

export default disputeService;
