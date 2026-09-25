import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import ProductImage from '../common/ProductImage';
import QuantitySelector from '../common/QuantitySelector';

// One product line used by the cart drawer and the cart page.
export default function CartLine({ item, onNavigate, compact = false }) {
  const { updateQuantity, removeItem } = useCart();
  const url = `/product/${item.slug || item.productId}`;

  return (
    <li className={`cart-line ${compact ? 'cart-line--compact' : ''}`}>
      <Link to={url} onClick={onNavigate} className="cart-line__image">
        <ProductImage src={item.image} alt={item.name} />
      </Link>
      <div className="cart-line__info">
        <Link to={url} onClick={onNavigate} className="cart-line__name">
          {item.name}
        </Link>
        <p className="cart-line__meta">
          {item.size && <span>Size: {item.size}</span>}
          {item.color && <span>Color: {item.color}</span>}
        </p>
        <p className="cart-line__unit">{formatPrice(item.price)}</p>
        <div className="cart-line__controls">
          <QuantitySelector value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} max={Math.min(99, item.stock ?? 99)} size="sm" label={`Quantity for ${item.name}`} />
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name} from bag`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="cart-line__total">{formatPrice(item.price * item.quantity)}</p>
    </li>
  );
}
