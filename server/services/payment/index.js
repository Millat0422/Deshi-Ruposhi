import { ApiError } from '../../utils/ApiError.js';
import { cashOnDeliveryProvider } from './cashOnDelivery.js';
import { sslcommerzProvider } from './sslcommerz.js';
import { stripeProvider } from './stripe.js';

// Payment providers share one small interface:
//   provider.id                 -> 'cod' | 'stripe' | 'sslcommerz'
//   provider.isEnabled()        -> true when configured and ready
//   provider.initiate(order)    -> { paymentStatus, redirectUrl?, clientSecret? }
// To add Stripe or SSLCommerz later, implement `initiate` (and a webhook route that
// marks the order as paid) in its file and make isEnabled() return true.
const providers = {
  [cashOnDeliveryProvider.id]: cashOnDeliveryProvider,
  [stripeProvider.id]: stripeProvider,
  [sslcommerzProvider.id]: sslcommerzProvider,
};

export const getPaymentProvider = (methodId) => {
  const provider = providers[methodId];
  if (!provider) throw ApiError.badRequest('Unknown payment method');
  if (!provider.isEnabled()) throw ApiError.badRequest(`${provider.label} is not available yet`);
  return provider;
};

export const listPaymentMethods = () =>
  Object.values(providers).map((provider) => ({
    id: provider.id,
    label: provider.label,
    description: provider.description,
    enabled: provider.isEnabled(),
  }));
