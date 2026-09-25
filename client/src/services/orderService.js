import api, { unwrap } from './api';

export const orderService = {
  config: () => unwrap(api.get('/orders/config')),
  quote: (payload) => unwrap(api.post('/orders/quote', payload)),
  create: (payload) => unwrap(api.post('/orders', payload)),
  mine: () => unwrap(api.get('/orders/my')),
  get: (id) => unwrap(api.get(`/orders/${id}`)),
  cancel: (id) => unwrap(api.put(`/orders/${id}/cancel`)),
  // admin
  list: (params) => unwrap(api.get('/orders', { params })),
  updateStatus: (id, status, note) => unwrap(api.put(`/orders/${id}/status`, { status, note })),
};
