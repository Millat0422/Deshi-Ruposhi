import api, { unwrap } from './api';

export const adminService = {
  stats: (days = 14) => unwrap(api.get('/admin/stats', { params: { days } })),
};

export const userService = {
  list: (params) => unwrap(api.get('/users', { params })),
  get: (id) => unwrap(api.get(`/users/${id}`)),
  update: (id, payload) => unwrap(api.put(`/users/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/users/${id}`)),
};

export const newsletterService = {
  subscribe: (email) => api.post('/newsletter', { email }).then((res) => res.data.message),
};
