import api from './api';

const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyTwoFactor: (data) => api.post('/auth/verify-2fa', data),
  setTwoFactor: (enabled) => api.put('/auth/2fa', { enabled }),
  googleLogin: (credential, role) => api.post('/auth/google', { credential, role }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  logout: () => api.post('/auth/logout'),
};

export default authService;
