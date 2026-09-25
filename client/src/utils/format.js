const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (value) => currencyFormatter.format(Number(value) || 0);

export const formatDate = (value, options = { year: 'numeric', month: 'short', day: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en-US', options).format(new Date(value)) : '';

export const formatDateTime = (value) =>
  formatDate(value, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const pluralize = (count, word, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`;

export const productUrl = (product) => `/product/${product.slug || product._id}`;
