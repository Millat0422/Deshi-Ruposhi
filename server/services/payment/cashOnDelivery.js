// Cash on Delivery: no money moves online. The order stays "pending" payment
// until it is delivered (the order controller marks it paid on delivery).
export const cashOnDeliveryProvider = {
  id: 'cod',
  label: 'Cash on Delivery',
  description: 'Pay with cash when your order arrives.',
  isEnabled: () => true,
  async initiate() {
    return { paymentStatus: 'pending' };
  },
};
