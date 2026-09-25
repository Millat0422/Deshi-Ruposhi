import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState, ErrorState } from '../../components/common/States';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { orderService } from '../../services/orderService';
import { ORDER_STATUSES, PAYMENT_LABELS } from '../../utils/constants';
import { formatDate, formatPrice } from '../../utils/format';

export default function AdminOrders() {
  useDocumentTitle('Orders · Admin');
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const debounced = useDebounce(search.trim(), 350);
  const status = params.get('status') || '';
  const paymentStatus = params.get('paymentStatus') || '';
  const page = Number(params.get('page')) || 1;

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    if (debounced !== (params.get('search') || '')) setParam('search', debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, loading, error, reload } = useAsync(
    () => orderService.list({ search: params.get('search') || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, page, limit: 20 }),
    [params.toString()]
  );

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Orders</h1>
        {data && <p className="muted">{data.total} total</p>}
      </header>

      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={16} aria-hidden="true" />
          <label htmlFor="admin-order-search" className="visually-hidden">
            Search orders
          </label>
          <input id="admin-order-search" type="search" placeholder="Order number, customer name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="sort-select">
          <span className="visually-hidden">Order status</span>
          <select value={status} onChange={(e) => setParam('status', e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="sort-select">
          <span className="visually-hidden">Payment status</span>
          <select value={paymentStatus} onChange={(e) => setParam('paymentStatus', e.target.value)}>
            <option value="">Any payment</option>
            <option value="pending">Payment pending</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
      </div>

      <section className="card card--flush">
        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.orders.length === 0 ? (
          <EmptyState title="No orders found" message="Orders will appear here as customers check out." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/admin/orders/${order._id}`} className="mono">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <span className="table__stack">
                        <strong>{order.user?.name || order.shippingAddress.fullName}</strong>
                        <small>{order.user?.email}</small>
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <span className="table__stack">
                        <small>{PAYMENT_LABELS[order.paymentMethod]}</small>
                        <StatusBadge status={order.paymentStatus} />
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="num">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParam('page', n > 1 ? String(n) : '')} />}
    </div>
  );
}
