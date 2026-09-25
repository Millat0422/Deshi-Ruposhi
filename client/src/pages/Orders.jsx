import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductImage from '../components/common/ProductImage';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState, ErrorState } from '../components/common/States';
import StatusBadge from '../components/common/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { orderService } from '../services/orderService';
import { formatDate, formatPrice, pluralize } from '../utils/format';

export default function Orders() {
  useDocumentTitle('My orders');
  const { data, loading, error, reload } = useAsync(() => orderService.mine(), []);

  return (
    <div className="container orders-page">
      <header className="page-header">
        <p className="eyebrow">My account</p>
        <h1>Order history</h1>
      </header>
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" message="Your orders will appear here once you place one." actionLabel="Start shopping" actionTo="/shop" />
      ) : (
        <ul className="order-cards">
          {data.orders.map((order) => (
            <li key={order._id} className="card order-card">
              <div className="order-card__head">
                <div>
                  <p className="order-card__number">{order.orderNumber}</p>
                  <p className="muted small">
                    Placed {formatDate(order.createdAt)} · {pluralize(order.items.reduce((s, i) => s + i.quantity, 0), 'item')}
                  </p>
                </div>
                <StatusBadge status={order.orderStatus} />
              </div>
              <div className="order-card__images">
                {order.items.slice(0, 4).map((item) => (
                  <ProductImage key={`${item.product}-${item.size}-${item.color}`} src={item.image} alt={item.name} />
                ))}
                {order.items.length > 4 && <span className="order-card__more">+{order.items.length - 4}</span>}
              </div>
              <div className="order-card__foot">
                <span>
                  Total <strong>{formatPrice(order.total)}</strong>
                </span>
                <Link to={`/orders/${order._id}`} className="btn btn--outline btn--sm">
                  View details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
