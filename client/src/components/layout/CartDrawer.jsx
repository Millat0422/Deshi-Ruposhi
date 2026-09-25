import { ShoppingBag, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { formatPrice } from '../../utils/format';
import CartLine from '../product/CartLine';
import OrderSummary from '../product/OrderSummary';

export default function CartDrawer() {
  const { cartOpen, closeCart } = useUI();
  const { items, totals, pricing } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  useLockBodyScroll(cartOpen);

  useEffect(() => {
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cartOpen, closeCart]);

  const progress = Math.min(100, (totals.subtotal / pricing.freeShippingThreshold) * 100);

  return (
    <>
      <div className={`overlay ${cartOpen ? 'is-open' : ''}`} onClick={closeCart} aria-hidden="true" />
      <aside className={`drawer ${cartOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden={!cartOpen} inert={cartOpen ? undefined : ''}>
        <header className="drawer__header">
          <h2>
            Your bag <span className="muted">({totals.itemCount})</span>
          </h2>
          <button type="button" className="icon-btn" onClick={closeCart} aria-label="Close bag">
            <X size={22} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <ShoppingBag size={40} strokeWidth={1.25} aria-hidden="true" />
            <p>Your bag is empty.</p>
            <Link to="/shop" className="btn btn--primary" onClick={closeCart}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer__shipping">
              <p>
                {totals.amountToFreeShipping > 0 ? (
                  <>
                    You are <strong>{formatPrice(totals.amountToFreeShipping)}</strong> away from free shipping
                  </>
                ) : (
                  <>You have unlocked <strong>free shipping</strong></>
                )}
              </p>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
            <ul className="drawer__items">
              {items.map((item) => (
                <CartLine key={item.key} item={item} onNavigate={closeCart} compact />
              ))}
            </ul>
            <footer className="drawer__footer">
              <OrderSummary subtotal={totals.subtotal} shipping={totals.shipping} tax={totals.tax} total={totals.total} estimate />
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => {
                  closeCart();
                  navigate('/checkout');
                }}
              >
                Checkout
              </button>
              <Link to="/cart" className="btn btn--outline btn--block" onClick={closeCart}>
                View bag
              </Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
