import axios from 'axios';

const API_URL = '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
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
  unmatch: (matchId) => api.delete(`/matches/${matchId}`)
};

// Messages API
export const messagesAPI = {
  getMessages: (matchId) => api.get(`/messages/${matchId}`),
  sendMessage: (matchId, content) => api.post(`/messages/${matchId}`, { content }),
  markAsRead: (matchId) => api.put(`/messages/${matchId}/read`)
};

// Payments API
export const paymentsAPI = {
  createPayment: (plan) => api.post('/payments/create', { plan }),
  getHistory: () => api.get('/payments/history'),
  getStatus: (paymentId) => api.get(`/payments/status/${paymentId}`)
};

export default api;