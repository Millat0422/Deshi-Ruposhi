// Simple coupon codes. Edit this list to run promotions.
// type: 'percent' -> value is a percentage, 'fixed' -> value is money off.
// (Move this to a MongoDB "Coupon" collection later if the admin should manage coupons.)
export const COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 0, description: '10% off your order' },
  { code: 'ORIXA20', type: 'fixed', value: 20, minSubtotal: 150, description: '$20 off orders over $150' },
];
