import axios from 'axios';

// Ensure baseURL ends with /api
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) {
    // Remove trailing slash if present
    const cleanURL = envURL.replace(/\/$/, '');
    // If URL already ends with /api, use as-is; otherwise append /api
    return cleanURL.endsWith('/api') ? cleanURL : `${cleanURL}/api`;
  }
  return '/api';
};

// Debug: Log the baseURL being used
console.log('API BaseURL:', getBaseURL());

const api = axios.create({
  baseURL: getBaseURL(),
});

export const auth = {
  login: (password) => api.post('/auth', { password }),
};

export const families = {
  getAll: () => api.get('/families'),
  getTree: (familyId) => api.get(`/families/${familyId}/tree`),
};

export const brothers = {
  get: (id) => api.get(`/brothers/${id}`),
  create: (data, password) => api.post('/brothers', { ...data, password }),
  update: (id, data, password) => api.put(`/brothers/${id}`, { ...data, password }),
};

export const relationships = {
  update: (littleId, data, password) => api.put(`/relationships/${littleId}`, { ...data, password }),
  create: (data, password) => api.post('/relationships', { ...data, password }),
};

export default api;

