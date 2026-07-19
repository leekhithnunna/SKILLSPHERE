import api from './api';

const proposalService = {
  createProposal: (data) => api.post('/proposals', data),
  getMyProposals: () => api.get('/proposals/my'),
  getProposalsByGig: (gigId) => api.get(`/proposals/gig/${gigId}`),
  updateProposal: (id, data) => api.put(`/proposals/${id}`, data),
  negotiateProposal: (id, data) => api.put(`/proposals/${id}/negotiate`, data),
  withdrawProposal: (id) => api.delete(`/proposals/${id}`),
  acceptProposal: (id) => api.put(`/proposals/${id}/accept`),
  rejectProposal: (id) => api.put(`/proposals/${id}/reject`),
};

export default proposalService;
