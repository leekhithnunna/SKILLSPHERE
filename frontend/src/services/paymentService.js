import api from './api';

const paymentService = {
  createOrder: (gigId, milestoneId) => api.post('/payments/order', { gigId, milestoneId }),
  verifyPayment: (data) => api.post('/payments/verify', data),
  releasePayment: (id) => api.post(`/payments/${id}/release`),
  refundPayment: (id, reason) => api.post(`/payments/${id}/refund`, { reason }),
  getMyPayments: () => api.get('/payments/my'),
  getPaymentsForGig: (gigId) => api.get(`/payments/gig/${gigId}`),
};

export default paymentService;
