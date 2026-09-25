import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Price from '../components/common/Price';
import ProductImage from '../components/common/ProductImage';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useUI } from '../context/UIContext';
import { useWishlist } from '../context/WishlistContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { productUrl } from '../utils/format';

function WishlistItem({ product }) {
  const { remove } = useWishlist();
  const { addItem } = useCart();
  const { openCart } = useUI();
  const toast = useToast();
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : '');
  const [error, setError] = useState('');

  const moveToCart = async () => {
    if (product.sizes.length > 0 && !size) {
      setError('Select a size first');
      return;
    }
    const result = addItem(product, { size, quantity: 1 });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    try {
      await remove(product._id);
    } catch {
      /* the item is in the bag either way */
    }
    toast.success(`${product.name} moved to your bag`, { action: { label: 'View bag', onClick: openCart } });
  };

  return (
    <li className="wishlist-item">
      <Link to={productUrl(product)} className="wishlist-item__image">
        <ProductImage src={product.images[0]} alt={product.name} />
      </Link>
      <div className="wishlist-item__body">
        <p className="product-card__category">{product.category?.name}</p>
        <Link to={productUrl(product)} className="wishlist-item__name">
          {product.name}
        </Link>
        <Price price={product.price} originalPrice={product.originalPrice} discount={product.discount} size="sm" />
        {product.stock <= 0 ? (
          <p className="stock stock--out">Out of stock</p>
        ) : (
          product.sizes.length > 1 && (
            <label className="wishlist-item__size">
              <span className="visually-hidden">Size for {product.name}</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  setError('');
                }}
                aria-invalid={Boolean(error)}
              >
                <option value="">Select size</option>
                {product.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )
        )}
        {error && <p className="field__error">{error}</p>}
        <div className="wishlist-item__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={moveToCart} disabled={product.stock <= 0}>
            <ShoppingBag size={14} aria-hidden="true" /> Move to bag
          </button>
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => remove(product._id).catch((e) => toast.error(e.message))} aria-label={`Remove ${product.name} from wishlist`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Wishlist() {
  useDocumentTitle('Wishlist');
  const { products, loading } = useWishlist();
  const { isAuthenticated } = useAuth();

  return (
    <div className="container wishlist-page">
      <header className="page-header">
        <h1>Wishlist</h1>
        {!isAuthenticated && products.length > 0 && (
          <p className="muted">
            <Link to="/login?redirect=/wishlist">Log in</Link> to save your wishlist to your account.
          </p>
        )}
      </header>
      {loading ? (
        <div className="product-grid product-grid--4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" message="Tap the heart on any product to save it for later." actionLabel="Discover products" actionTo="/shop" />
      ) : (
        <ul className="wishlist-grid">
          {products.map((product) => (
            <WishlistItem key={product._id} product={product} />
          ))}
        </ul>
      )}
    </div>
  );
}
