import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/common/Modal';
import { PageLoader } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/States';
import StatusBadge from '../../components/common/StatusBadge';
import OrderSummary from '../../components/product/OrderSummary';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { orderService } from '../../services/orderService';
import { PAYMENT_LABELS, STATUS_TRANSITIONS } from '../../utils/constants';
import { formatDateTime, formatPrice } from '../../utils/format';
import { OrderItems, OrderTimeline } from '../OrderDetails';

export default function AdminOrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => orderService.get(id), [id]);
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(null); // status awaiting confirmation
  const [saving, setSaving] = useState(false);
  const order = data?.order;
  useDocumentTitle(order ? `${order.orderNumber} · Admin` : 'Order · Admin');

  if (loading && !order) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const nextStatuses = STATUS_TRANSITIONS[order.orderStatus] || [];

  const changeStatus = async () => {
    setSaving(true);
    try {
      const { order: updated } = await orderService.updateStatus(order._id, pending, note.trim() || undefined);
      setData({ order: updated });
      toast.success(`Order marked as ${updated.orderStatus}`);
      setNote('');
      setPending(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const a = order.shippingAddress;

  return (
    <div className="admin-page">
      <Link to="/admin/orders" className="link-btn">
        <ChevronLeft size={16} aria-hidden="true" /> Orders
      </Link>
      <header className="admin-page__header">
        <div>
          <h1 className="mono">{order.orderNumber}</h1>
          <p className="muted small">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </header>

      <OrderTimeline status={order.orderStatus} />

      <div className="order-details__grid">
        <div className="admin-stack">
          <section className="card">
            <h2>Items</h2>
            <OrderItems items={order.items} />
          </section>
          <section className="card">
            <h2>History</h2>
            <ol className="history">
              {[...(order.statusHistory || [])].reverse().map((entry, index) => (
                <li key={index}>
                  <StatusBadge status={entry.status} />
                  <span>{formatDateTime(entry.changedAt)}</span>
                  {entry.note && <em>{entry.note}</em>}
                </li>
              ))}
            </ol>
            {order.notes && (
              <p className="note">
                <strong>Customer note:</strong> {order.notes}
              </p>
            )}
          </section>
        </div>

        <aside className="order-details__side">
          <section className="card">
            <h2>Update status</h2>
            {nextStatuses.length === 0 ? (
              <p className="muted">This order is {order.orderStatus.toLowerCase()} — no further changes.</p>
            ) : (
              <>
                <label className="field">
                  <span className="field__label">Note (optional)</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. courier tracking number" />
                </label>
                <div className="status-actions">
                  {nextStatuses.map((status) => (
                    <button key={status} type="button" className={`btn ${status === 'Cancelled' ? 'btn--danger-outline' : 'btn--primary'}`} onClick={() => setPending(status)}>
                      {status === 'Cancelled' ? 'Cancel order' : `Mark as ${status}`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
          <section className="card">
            <h2>Customer</h2>
            <p>
              <strong>{order.user?.name}</strong>
            </p>
            <p className="muted">{order.user?.email}</p>
          </section>
          <section className="card">
            <h2>Shipping address</h2>
            <p>
              <strong>{a.fullName}</strong> · {a.phone}
            </p>
            <p className="muted">
              {a.address}, {a.city}, {a.state} {a.postalCode}, {a.country}
            </p>
          </section>
          <section className="card">
            <h2>Payment</h2>
            <p>{PAYMENT_LABELS[order.paymentMethod]}</p>
            <StatusBadge status={order.paymentStatus}>Payment {order.paymentStatus}</StatusBadge>
            <OrderSummary subtotal={order.subtotal} shipping={order.shippingCost} discount={order.discount} tax={order.tax} total={order.total} couponCode={order.couponCode} />
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending === 'Cancelled' ? 'Cancel order?' : `Mark as ${pending}?`}
        message={
          pending === 'Cancelled'
            ? 'The items will be returned to stock and the customer will see the order as cancelled.'
            : pending === 'Delivered' && order.paymentMethod === 'cod'
              ? `This also records the cash payment of ${formatPrice(order.total)} as received.`
              : `The order will move from ${order.orderStatus} to ${pending}.`
        }
        confirmLabel={pending === 'Cancelled' ? 'Cancel order' : 'Confirm'}
        danger={pending === 'Cancelled'}
        loading={saving}
        onConfirm={changeStatus}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
