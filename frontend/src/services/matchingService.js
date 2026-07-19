import api from './api';

const matchingService = {
  getFreelancerRecommendations: (gigId) => api.get(`/matching/gigs/${gigId}/recommendations`),
  getRecommendedGigs: () => api.get('/matching/recommended-gigs'),
  getTrendingSkills: () => api.get('/matching/trending-skills'),
};

export default matchingService;
