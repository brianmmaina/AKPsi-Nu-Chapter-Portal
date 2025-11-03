import axios from 'axios';

// Ensure baseURL ends with /api
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) {
    const cleanURL = envURL.replace(/\/$/, '');
    return cleanURL.endsWith('/api') ? cleanURL : `${cleanURL}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.error?.includes('expired')) {
      // Token expired, clear session
      sessionStorage.removeItem('authenticated');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('selectedFamily');
      // Redirect to login on next render
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (password) => api.post('/auth', { password }),
};

export const families = {
  getAll: () => api.get('/families'),
  getTree: (familyId) => api.get(`/families/${familyId}/tree`),
};

export const brothers = {
  get: (id) => api.get(`/brothers/${id}`),
  create: (data) => api.post('/brothers', data), // Token is added via interceptor
  update: (id, data) => api.put(`/brothers/${id}`, data), // Token is added via interceptor
};

export const relationships = {
  update: (littleId, data) => api.put(`/relationships/${littleId}`, data), // Token is added via interceptor
  create: (data) => api.post('/relationships', data), // Token is added via interceptor
};

export default api;
