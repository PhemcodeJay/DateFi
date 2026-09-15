import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.response?.data?.expired) {
      // Try to refresh token
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data.token;
        localStorage.setItem('token', newToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demoLogin: () => api.post('/auth/demo-login'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
};

// Profiles API
export const profilesAPI = {
  updateProfile: (data) => api.put('/profiles/me', data),
  uploadPhoto: (formData) => api.post('/profiles/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePhoto: (photoUrl) => api.delete(`/profiles/photo/${photoUrl}`),
  discover: () => api.get('/profiles/discover'),
  getUser: (id) => api.get(`/profiles/${id}`)
};

// Matches API
export const matchesAPI = {
  like: (userId) => api.post(`/matches/like/${userId}`),
  pass: (userId) => api.post(`/matches/pass/${userId}`),
  getMatches: () => api.get('/matches'),
  getMatchInfo: (matchId) => api.get(`/matches/${matchId}/info`),
  unmatch: (matchId) => api.delete(`/matches/${matchId}`)
};

// Messages API
export const messagesAPI = {
  getMessages: (matchId) => api.get(`/messages/${matchId}`),
  sendMessage: (matchId, content) => api.post(`/messages/${matchId}`, { content }),
  sendMediaMessage: (matchId, formData) => api.post(`/messages/${matchId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000 // 2 minute timeout for large uploads
  }),
  markAsRead: (matchId) => api.put(`/messages/${matchId}/read`)
};

// Payments API
export const paymentsAPI = {
  createPayment: (plan) => api.post('/payments/create', { plan }),
  getHistory: () => api.get('/payments/history'),
  getStatus: (paymentId) => api.get(`/payments/status/${paymentId}`)
};

export { SOCKET_URL };
export default api;