import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/common/States';
import CartLine from '../components/product/CartLine';
import OrderSummary from '../components/product/OrderSummary';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/format';

export default function Cart() {
  useDocumentTitle('Your bag');
  const { items, totals, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" message="Looks like you haven't added anything yet." actionLabel="Continue shopping" actionTo="/shop" />
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <header className="page-header">
        <h1>Your bag</h1>
        <p className="muted">{totals.itemCount} items</p>
      </header>
      <div className="cart-page__grid">
        <section aria-label="Items in your bag">
          <ul className="cart-page__items">
            {items.map((item) => (
              <CartLine key={item.key} item={item} />
            ))}
          </ul>
          <div className="cart-page__actions">
            <Link to="/shop" className="link-arrow">
              Continue shopping
            </Link>
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearCart}>
              Clear bag
            </button>
          </div>
        </section>
        <aside className="card cart-page__summary" aria-label="Order summary">
          <h2>Order summary</h2>
          {totals.amountToFreeShipping > 0 && <p className="note">Add {formatPrice(totals.amountToFreeShipping)} more for free shipping.</p>}
          <OrderSummary subtotal={totals.subtotal} shipping={totals.shipping} tax={totals.tax} total={totals.total} estimate />
          <p className="muted small">Have a coupon? You can apply it at checkout.</p>
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => navigate('/checkout')}>
            Checkout <ArrowRight size={18} aria-hidden="true" />
          </button>
        </aside>
      </div>
    </div>
  );
}
