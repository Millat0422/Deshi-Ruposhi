import api, { unwrap, unwrapWithMessage } from './api';

export const authService = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (payload) => unwrapWithMessage(api.put('/auth/profile', payload)),
  forgotPassword: (email) => unwrapWithMessage(api.post('/auth/forgot-password', { email })),
  resetPassword: (token, password) => unwrap(api.post(`/auth/reset-password/${token}`, { password })),
  addAddress: (address) => unwrap(api.post('/auth/addresses', address)),
  updateAddress: (id, address) => unwrap(api.put(`/auth/addresses/${id}`, address)),
  deleteAddress: (id) => unwrap(api.delete(`/auth/addresses/${id}`)),
};
