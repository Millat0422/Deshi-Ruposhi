import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/Modal';
import ProductImage from '../components/common/ProductImage';
import { PageLoader } from '../components/common/Spinner';
import { EmptyState, ErrorState } from '../components/common/States';
import StatusBadge from '../components/common/StatusBadge';
import OrderSummary from '../components/product/OrderSummary';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { orderService } from '../services/orderService';
import { PAYMENT_LABELS } from '../utils/constants';
import { formatDateTime, formatPrice } from '../utils/format';

const TIMELINE = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export function OrderTimeline({ status }) {
  if (status === 'Cancelled') return <p className="alert alert--error">This order was cancelled.</p>;
  const current = TIMELINE.indexOf(status);
  return (
    <ol className="timeline" aria-label="Order progress">
      {TIMELINE.map((step, index) => (
        <li key={step} className={index <= current ? 'is-done' : ''} aria-current={index === current ? 'step' : undefined}>
          <span className="timeline__dot" />
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderItems({ items }) {
  return (
    <ul className="review-items">
      {items.map((item) => (
        <li key={`${item.product}-${item.size}-${item.color}`}>
          <ProductImage src={item.image} alt={item.name} />
          <span className="review-items__info">
            <Link to={`/product/${item.product}`}>
              <strong>{item.name}</strong>
            </Link>
            <small>
              {[item.size && `Size ${item.size}`, item.color, item.sku].filter(Boolean).join(' · ')} · Qty {item.quantity} × {formatPrice(item.price)}
            </small>
          </span>
          <span>{formatPrice(item.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => orderService.get(id), [id]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const order = data?.order;
  useDocumentTitle(order ? `Order ${order.orderNumber}` : 'Order');

  if (loading && !order) return <PageLoader />;
  if (error) {
    return (
      <div className="container section">
        {error.status === 404 ? <EmptyState title="Order not found" actionLabel="My orders" actionTo="/orders" /> : <ErrorState error={error} onRetry={reload} />}
      </div>
    );
  }

  const cancel = async () => {
    setCancelling(true);
    try {
      const { order: updated } = await orderService.cancel(order._id);
      setData({ order: updated });
      toast.success('Your order has been cancelled');
      setConfirmCancel(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const address = order.shippingAddress;

  return (
    <div className="container order-details">
      <Link to="/orders" className="link-btn">
        <ChevronLeft size={16} aria-hidden="true" /> All orders
      </Link>

      {params.get('placed') && (
        <div className="order-success" role="status">
          <CheckCircle2 size={32} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2>Thank you — your order is placed</h2>
            <p>
              Order <strong>{order.orderNumber}</strong> is confirmed as pending. You will pay {formatPrice(order.total)} in cash on delivery.
            </p>
          </div>
        </div>
      )}

      <header className="page-header page-header--row">
        <div>
          <p className="eyebrow">Order</p>
          <h1>{order.orderNumber}</h1>
          <p className="muted small">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </header>

      <OrderTimeline status={order.orderStatus} />

      <div className="order-details__grid">
        <section className="card">
          <h2>Items</h2>
          <OrderItems items={order.items} />
        </section>
        <aside className="order-details__side">
          <section className="card">
            <h2>Summary</h2>
            <OrderSummary subtotal={order.subtotal} shipping={order.shippingCost} discount={order.discount} tax={order.tax} total={order.total} couponCode={order.couponCode} />
          </section>
          <section className="card">
            <h2>Shipping</h2>
            <p>
              <strong>{address.fullName}</strong>
            </p>
            <p className="muted">
              {address.address}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </p>
            <p className="muted">{address.phone}</p>
          </section>
          <section className="card">
            <h2>Payment</h2>
            <p>{PAYMENT_LABELS[order.paymentMethod]}</p>
            <StatusBadge status={order.paymentStatus}>Payment {order.paymentStatus}</StatusBadge>
          </section>
          {['Pending', 'Confirmed'].includes(order.orderStatus) && (
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </button>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message="The items will be released back to stock. This cannot be undone."
        confirmLabel="Cancel order"
        danger
        loading={cancelling}
        onConfirm={cancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
