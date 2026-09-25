import { formatPrice } from '../../utils/format';

// Subtotal / shipping / discount / tax / total block.
export default function OrderSummary({ subtotal, shipping, discount = 0, tax, total, couponCode, estimate = false, children }) {
  return (
    <dl className="summary">
      <div className="summary__row">
        <dt>Subtotal</dt>
        <dd>{formatPrice(subtotal)}</dd>
      </div>
      <div className="summary__row">
        <dt>Shipping</dt>
        <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
      </div>
      {discount > 0 && (
        <div className="summary__row summary__row--discount">
          <dt>Discount{couponCode ? ` (${couponCode})` : ''}</dt>
          <dd>−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="summary__row">
        <dt>Tax{estimate ? ' (estimated)' : ''}</dt>
        <dd>{formatPrice(tax)}</dd>
      </div>
      <div className="summary__row summary__row--total">
        <dt>Total</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
      {children}
    </dl>
  );
}
