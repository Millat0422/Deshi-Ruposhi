import { ApiError } from '../../utils/ApiError.js';

// Placeholder for a future Stripe integration.
// Steps to enable:
//   1. npm install stripe
//   2. Create a PaymentIntent in `initiate(order)` and return its client_secret
//   3. Add a webhook route that verifies the signature and sets order.paymentStatus = 'paid'
//   4. Return true from isEnabled() when STRIPE_SECRET_KEY is set
export const stripeProvider = {
  id: 'stripe',
  label: 'Card (Stripe)',
  description: 'Online card payments — coming soon.',
  isEnabled: () => false,
  async initiate() {
    throw new ApiError(501, 'Stripe payments are not implemented yet');
  },
};
