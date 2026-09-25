import { ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useUI } from '../../context/UIContext';
import { productUrl } from '../../utils/format';
import Price from '../common/Price';
import ProductImage from '../common/ProductImage';
import Rating from '../common/Rating';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { openCart } = useUI();
  const toast = useToast();
  const [choosingSize, setChoosingSize] = useState(false);

  const url = productUrl(product);
  const soldOut = product.stock <= 0;
  const needsSize = product.sizes.length > 1;

  const add = (size) => {
    const result = addItem(product, { size, quantity: 1 });
    if (result.ok) {
      setChoosingSize(false);
      toast.success(result.message, { action: { label: 'View bag', onClick: openCart } });
    } else toast.error(result.message);
  };

  const onAddClick = () => {
    if (needsSize) setChoosingSize(true);
    else add(product.sizes[0] || '');
  };

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={url} tabIndex={-1} aria-hidden="true">
          <ProductImage src={product.images[0]} alt={product.name} className="product-card__img" />
          {product.images[1] && <ProductImage src={product.images[1]} alt="" className="product-card__img product-card__img--alt" />}
        </Link>

        <div className="product-card__tags">
          {soldOut && <span className="tag tag--dark">Sold out</span>}
          {!soldOut && product.discount > 0 && <span className="tag tag--sale">-{product.discount}%</span>}
          {!soldOut && product.stock > 0 && product.stock <= 5 && <span className="tag">Only {product.stock} left</span>}
        </div>

        <WishlistButton product={product} className="product-card__wish" />

        {choosingSize ? (
          <div className="product-card__sizes" role="group" aria-label={`Choose a size for ${product.name}`}>
            <div className="product-card__sizes-head">
              <span>Select size</span>
              <button type="button" onClick={() => setChoosingSize(false)} aria-label="Close size picker">
                <X size={16} />
              </button>
            </div>
            <div className="product-card__size-list">
              {product.sizes.map((size) => (
                <button key={size} type="button" onClick={() => add(size)}>
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button type="button" className="product-card__add" onClick={onAddClick} disabled={soldOut}>
            <ShoppingBag size={16} aria-hidden="true" />
            {soldOut ? 'Sold out' : 'Add to bag'}
          </button>
        )}
      </div>

      <div className="product-card__body">
        <p className="product-card__category">{product.category?.name}</p>
        <h3 className="product-card__name">
          <Link to={url}>{product.name}</Link>
        </h3>
        <div className="product-card__row">
          <Price price={product.price} originalPrice={product.originalPrice} discount={product.discount} size="sm" />
          <Rating value={product.rating} size={12} />
        </div>
      </div>
    </article>
  );
}
