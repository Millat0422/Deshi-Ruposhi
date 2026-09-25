import { storage, STORAGE_KEYS } from '../utils/storage';
import api, { unwrap } from './api';

// Only the fields the server needs.
const toPayload = (items) =>
  items.map(({ productId, quantity, size, color }) => ({ product: productId, quantity, size: size || '', color: color || '' }));

export const cartService = {
  get: () => unwrap(api.get('/cart')),
  replace: (items) => unwrap(api.put('/cart', { items: toPayload(items) })),
  merge: (items) => unwrap(api.post('/cart/merge', { items: toPayload(items) })),
  clear: () => unwrap(api.delete('/cart')),
  // Fire-and-forget save that survives page unload (used on tab close / reload).
  flush: (items) => {
    const token = storage.get(STORAGE_KEYS.token);
    if (!token) return;
    fetch(`${api.defaults.baseURL}/cart`, {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: toPayload(items) }),
    }).catch(() => {});
  },
};
