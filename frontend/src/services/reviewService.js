import api from './api';

const reviewService = {
  createReview: (data) => api.post('/reviews', data),
  getReviewsForUser: (userId) => api.get(`/reviews/user/${userId}`),
  getMyReviews: () => api.get('/reviews/my'),
};

export default reviewService;
