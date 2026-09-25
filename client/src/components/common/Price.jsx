import { formatPrice } from '../../utils/format';

export default function Price({ price, originalPrice, discount, size = 'md' }) {
  const onSale = originalPrice > price;
  return (
    <span className={`price price--${size}`}>
      <span className={`price__current ${onSale ? 'is-sale' : ''}`}>{formatPrice(price)}</span>
      {onSale && (
        <>
          <s className="price__original" aria-label={`Original price ${formatPrice(originalPrice)}`}>
            {formatPrice(originalPrice)}
          </s>
          {discount > 0 && <span className="price__discount">-{discount}%</span>}
        </>
      )}
    </span>
  );
}
