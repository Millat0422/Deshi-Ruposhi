// Mirrors the server's pricing rules to show instant estimates in the cart.
// The FINAL total is always calculated by the server when the order is placed.
export const DEFAULT_PRICING = { freeShippingThreshold: 50, shippingFlatRate: 10, taxRate: 0.05, currency: 'USD' };

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateCartTotals = (items, pricing = DEFAULT_PRICING, discount = 0) => {
  const subtotal = round(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const safeDiscount = Math.min(discount, subtotal);
  const shipping = subtotal === 0 || subtotal >= pricing.freeShippingThreshold ? 0 : pricing.shippingFlatRate;
  const tax = round((subtotal - safeDiscount) * pricing.taxRate);
  const total = round(subtotal - safeDiscount + shipping + tax);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const amountToFreeShipping = subtotal > 0 ? Math.max(0, round(pricing.freeShippingThreshold - subtotal)) : pricing.freeShippingThreshold;
  return { subtotal, discount: safeDiscount, shipping, tax, total, itemCount, amountToFreeShipping };
};
