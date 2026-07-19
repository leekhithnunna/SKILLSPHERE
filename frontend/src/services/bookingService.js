import api from './api';

const bookingService = {
  getAvailability: (freelancerId, date) => api.get(`/bookings/availability/${freelancerId}`, { params: { date } }),
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
};

export default bookingService;
