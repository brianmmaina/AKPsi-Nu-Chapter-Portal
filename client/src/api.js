import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

