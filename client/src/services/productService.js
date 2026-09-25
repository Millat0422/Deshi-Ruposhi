import api, { unwrap } from './api';

// Remove empty params so URLs stay clean: /products?search=tee
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const productService = {
  list: (params) => unwrap(api.get('/products', { params: clean(params) })),
  filters: () => unwrap(api.get('/products/filters')),
  get: (idOrSlug) => unwrap(api.get(`/products/${encodeURIComponent(idOrSlug)}`)),
  byIds: (ids) => (ids.length ? unwrap(api.get('/products', { params: { ids: ids.join(','), limit: 60 } })) : Promise.resolve({ products: [] })),
  create: (payload) => unwrap(api.post('/products', payload)),
  update: (id, payload) => unwrap(api.put(`/products/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/products/${id}`)),
};

export const categoryService = {
  list: (params) => unwrap(api.get('/categories', { params: clean(params) })),
  create: (payload) => unwrap(api.post('/categories', payload)),
  update: (id, payload) => unwrap(api.put(`/categories/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/categories/${id}`)),
};
