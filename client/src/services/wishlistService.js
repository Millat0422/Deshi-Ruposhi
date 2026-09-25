import api, { unwrap } from './api';

export const wishlistService = {
  get: () => unwrap(api.get('/wishlist')),
  add: (productId) => unwrap(api.post(`/wishlist/${productId}`)),
  remove: (productId) => unwrap(api.delete(`/wishlist/${productId}`)),
  merge: (productIds) => unwrap(api.post('/wishlist/merge', { productIds })),
};
