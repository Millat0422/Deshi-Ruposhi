import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import SalesChart from '../../components/admin/SalesChart';
import ProductImage from '../../components/common/ProductImage';
import { Skeleton } from '../../components/common/Skeleton';
import { ErrorState } from '../../components/common/States';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { adminService } from '../../services/adminService';
import { ORDER_STATUSES } from '../../utils/constants';
import { formatDate, formatPrice } from '../../utils/format';

export default function Dashboard() {
  useDocumentTitle('Admin dashboard');
  const [days, setDays] = useState(14);
  const { data, loading, error, reload } = useAsync(() => adminService.stats(days), [days]);

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const stats = data?.totals;
  const cards = [
    { label: 'Total sales', value: stats && formatPrice(stats.sales), Icon: DollarSign, hint: 'Excludes cancelled orders' },
    { label: 'Total orders', value: stats?.orders, Icon: ShoppingCart, to: '/admin/orders' },
    { label: 'Customers', value: stats?.users, Icon: Users, to: '/admin/users' },
    { label: 'Products', value: stats?.products, Icon: Package, to: '/admin/products' },
  ];

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Dashboard</h1>
      </header>

      <ul className="stat-grid">
        {cards.map(({ label, value, Icon, to, hint }) => (
          <li key={label} className="stat-card">
            <span className="stat-card__icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <p className="stat-card__label">{label}</p>
            {loading && !data ? <Skeleton className="skeleton--title" /> : <p className="stat-card__value">{value}</p>}
            {to && (
              <Link to={to} className="stat-card__link">
                View
              </Link>
            )}
            {hint && <p className="stat-card__hint">{hint}</p>}
          </li>
        ))}
      </ul>

      <div className="admin-grid">
        <section className="card admin-grid__wide">
          <div className="panel-head">
            <h2>Revenue</h2>
            <label className="sort-select">
              <span className="visually-hidden">Range</span>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
          </div>
          {data ? <SalesChart data={data.salesByDay} /> : <Skeleton className="skeleton--chart" />}
        </section>

        <section className="card">
          <h2>Orders by status</h2>
          <ul className="status-list">
            {ORDER_STATUSES.map((status) => (
              <li key={status}>
                <Link to={`/admin/orders?status=${status}`}>
                  <StatusBadge status={status} />
                  <strong>{data?.ordersByStatus?.[status] || 0}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="panel-head">
            <h2>Low stock</h2>
            <Link to="/admin/products" className="link-arrow">
              Products
            </Link>
          </div>
          {data?.lowStock?.length === 0 && <p className="muted">All products are well stocked.</p>}
          <ul className="mini-list">
            {data?.lowStock?.map((product) => (
              <li key={product._id}>
                <ProductImage src={product.images[0]} alt="" />
                <Link to={`/admin/products/${product._id}/edit`}>{product.name}</Link>
                <span className={product.stock === 0 ? 'text-danger' : 'text-warning'}>{product.stock} left</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card admin-grid__wide">
          <div className="panel-head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders" className="link-arrow">
              All orders
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/admin/orders/${order._id}`}>{order.orderNumber}</Link>
                    </td>
                    <td>{order.user?.name || order.shippingAddress.fullName}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="num">{formatPrice(order.total)}</td>
                  </tr>
                ))}
                {data?.recentOrders?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted center">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
