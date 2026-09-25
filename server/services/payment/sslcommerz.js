import { ApiError } from '../../utils/ApiError.js';

// Placeholder for a future SSLCommerz integration (Bangladesh).
// Steps to enable:
//   1. Create a session with the SSLCommerz API in `initiate(order)` and return { redirectUrl }
//   2. Add IPN / success / fail routes that VALIDATE the transaction with SSLCommerz
//      before setting order.paymentStatus = 'paid'
//   3. Return true from isEnabled() when the store credentials are configured
export const sslcommerzProvider = {
  id: 'sslcommerz',
  label: 'SSLCommerz',
  description: 'bKash, Nagad, cards & net banking — coming soon.',
  isEnabled: () => false,
  async initiate() {
    throw new ApiError(501, 'SSLCommerz payments are not implemented yet');
  },
};
