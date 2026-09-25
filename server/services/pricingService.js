import { env } from '../config/env.js';
import { COUPONS } from '../config/promotions.js';
import { ApiError } from '../utils/ApiError.js';
import { roundMoney } from '../utils/helpers.js';

export const findCoupon = (code) => {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized) || null;
};

const couponDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  if (subtotal < coupon.minSubtotal) {
    throw ApiError.badRequest(`Coupon ${coupon.code} requires a subtotal of at least $${coupon.minSubtotal}`);
  }
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  return roundMoney(Math.min(raw, subtotal));
};

// The ONE place totals are calculated. The client shows an estimate using the same
// rules, but the order total saved in the database always comes from here.
export const calculateTotals = (lineItems, couponCode) => {
  const { freeShippingThreshold, shippingFlatRate, taxRate } = env.pricing;

  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0));

  let coupon = null;
  if (couponCode) {
    coupon = findCoupon(couponCode);
    if (!coupon) throw ApiError.badRequest('Invalid coupon code');
  }
  const discount = couponDiscount(coupon, subtotal);

  const discountedSubtotal = roundMoney(subtotal - discount);
  const shippingCost = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : shippingFlatRate;
  const tax = roundMoney(discountedSubtotal * taxRate);
  const total = roundMoney(discountedSubtotal + shippingCost + tax);

  return {
    subtotal,
    discount,
    shippingCost: roundMoney(shippingCost),
    tax,
    total,
    couponCode: coupon ? coupon.code : '',
  };
};

export const pricingConfig = () => ({ ...env.pricing });
