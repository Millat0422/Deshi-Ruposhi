import { Check, ChevronRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Price from '../components/common/Price';
import ProductImage from '../components/common/ProductImage';
import QuantitySelector from '../components/common/QuantitySelector';
import Rating from '../components/common/Rating';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState, ErrorState } from '../components/common/States';
import SectionHeading from '../components/home/SectionHeading';
import ProductGrid from '../components/product/ProductGrid';
import WishlistButton from '../components/product/WishlistButton';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useUI } from '../context/UIContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { productService } from '../services/productService';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem, pricing } = useCart();
  const { openCart } = useUI();
  const { data, loading, error, reload } = useAsync(() => productService.get(id), [id]);

  const product = data?.product;
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState('');

  useDocumentTitle(product?.name || 'Product');

  // Reset selections when navigating to another product.
  useEffect(() => {
    if (!product) return;
    setActiveImage(0);
    setSize(product.sizes.length === 1 ? product.sizes[0] : '');
    setColor(product.colors[0]?.name || '');
    setQuantity(1);
    setSizeError('');
  }, [product]);

  if (loading && !product) {
    return (
      <div className="container pdp">
        <div className="pdp__grid">
          <Skeleton className="skeleton--pdp-image" />
          <div className="pdp__info">
            <Skeleton className="skeleton--line" style={{ width: '30%' }} />
            <Skeleton className="skeleton--title" />
            <Skeleton className="skeleton--line" style={{ width: '50%' }} />
            <Skeleton className="skeleton--block" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        {error.status === 404 ? (
          <EmptyState title="Product not found" message="This product may have been removed or is no longer available." actionLabel="Back to shop" actionTo="/shop" />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  if (!product) return null;

  const soldOut = product.stock <= 0;
  const requiresSize = product.sizes.length > 0;
  const maxQty = Math.max(1, Math.min(99, product.stock));

  const handleAdd = (goToCheckout) => {
    if (requiresSize && !size) {
      setSizeError('Please select a size');
      document.getElementById('size-options')?.focus();
      return;
    }
    const result = addItem(product, { size, color, quantity });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    if (goToCheckout) navigate('/checkout');
    else toast.success(result.message, { action: { label: 'View bag', onClick: openCart } });
  };

  return (
    <div className="container pdp">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link to="/shop">Shop</Link>
        {product.category && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
        <ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp__grid">
        <div className="pdp__gallery">
          <div className="pdp__main-image">
            <ProductImage src={product.images[activeImage]} alt={`${product.name} — image ${activeImage + 1}`} loading="eager" />
            {product.discount > 0 && !soldOut && <span className="tag tag--sale pdp__tag">-{product.discount}%</span>}
          </div>
          {product.images.length > 1 && (
            <div className="pdp__thumbs" role="list">
              {product.images.map((image, index) => (
                <button key={image} type="button" role="listitem" className={index === activeImage ? 'is-active' : ''} onClick={() => setActiveImage(index)} aria-label={`Show image ${index + 1}`}>
                  <ProductImage src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp__info">
          <p className="eyebrow">{product.category?.name}</p>
          <h1 className="pdp__title">{product.name}</h1>
          <div className="pdp__rating">
            <Rating value={product.rating} />
            <span className="muted">{product.numReviews} reviews</span>
          </div>
          <Price price={product.price} originalPrice={product.originalPrice} discount={product.discount} size="lg" />

          <p className={`stock ${soldOut ? 'stock--out' : product.stock <= 5 ? 'stock--low' : 'stock--in'}`}>
            {soldOut ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left in stock` : 'In stock'}
          </p>

          <p className="pdp__description">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="option-group">
              <p className="option-group__label">
                Color: <strong>{color}</strong>
              </p>
              <div className="swatches" role="radiogroup" aria-label="Color">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={color === c.name}
                    aria-label={c.name}
                    title={c.name}
                    className={`swatch-btn ${color === c.name ? 'is-active' : ''}`}
                    onClick={() => setColor(c.name)}
                  >
                    <span style={{ background: c.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {requiresSize && (
            <div className={`option-group ${sizeError ? 'has-error' : ''}`}>
              <p className="option-group__label">
                Size: <strong>{size || 'Select a size'}</strong>
              </p>
              <div className="size-options" id="size-options" role="radiogroup" aria-label="Size" tabIndex={-1} aria-describedby={sizeError ? 'size-error' : undefined}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    className={`size-btn ${size === s ? 'is-active' : ''}`}
                    onClick={() => {
                      setSize(s);
                      setSizeError('');
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="field__error" id="size-error" role="alert">
                  {sizeError}
                </p>
              )}
            </div>
          )}

          <div className="pdp__buy">
            <QuantitySelector value={quantity} onChange={(q) => setQuantity(Math.max(1, Math.min(q, maxQty)))} max={maxQty} />
            <button type="button" className="btn btn--primary btn--lg pdp__add" onClick={() => handleAdd(false)} disabled={soldOut}>
              {soldOut ? 'Sold out' : 'Add to bag'}
            </button>
            <WishlistButton product={product} className="pdp__wish" />
          </div>
          <button type="button" className="btn btn--outline btn--lg btn--block" onClick={() => handleAdd(true)} disabled={soldOut}>
            Buy now
          </button>

          <ul className="pdp__perks">
            <li>
              <Truck size={18} aria-hidden="true" /> Free shipping on orders over ${pricing.freeShippingThreshold}
            </li>
            <li>
              <RotateCcw size={18} aria-hidden="true" /> Easy 14-day returns
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Pay cash on delivery
            </li>
          </ul>

          <dl className="pdp__specs">
            <div>
              <dt>SKU</dt>
              <dd>{product.sku}</dd>
            </div>
            <div>
              <dt>Brand</dt>
              <dd>{product.brand}</dd>
            </div>
            <div>
              <dt>Fit</dt>
              <dd>
                <Check size={14} aria-hidden="true" /> {product.gender === 'unisex' ? 'Unisex' : product.gender === 'men' ? 'Men' : 'Women'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {data.related?.length > 0 && (
        <section className="section" aria-labelledby="related-title">
          <SectionHeading id="related-title" eyebrow="You may also like" title="Complete the look" />
          <ProductGrid products={data.related} />
        </section>
      )}
    </div>
  );
}
