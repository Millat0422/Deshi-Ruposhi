import { Heart, KeyRound, LayoutDashboard, LogOut, MapPin, Package, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AddressForm from '../components/common/AddressForm';
import FormField from '../components/common/FormField';
import Modal, { ConfirmDialog } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState, ErrorState, InlineAlert } from '../components/common/States';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { formatDate, formatPrice } from '../utils/format';
import { passwordProblem } from '../utils/validators';

const TABS = [
  { id: 'account', label: 'Account', Icon: User },
  { id: 'orders', label: 'Orders', Icon: Package },
  { id: 'addresses', label: 'Addresses', Icon: MapPin },
  { id: 'security', label: 'Password', Icon: KeyRound },
];

function AccountTab() {
  const { user, updateProfile } = useAuth();
  const { count } = useWishlist();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    setError('');
    try {
      toast.success(await updateProfile({ name: name.trim() }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile__panel">
      <h2>Account information</h2>
      <dl className="info-list">
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </div>
        <div>
          <dt>Account type</dt>
          <dd>{user.isAdmin ? 'Administrator' : 'Customer'}</dd>
        </div>
        <div>
          <dt>Wishlist</dt>
          <dd>
            <Link to="/wishlist">
              <Heart size={14} aria-hidden="true" /> {count} saved items
            </Link>
          </dd>
        </div>
      </dl>
      <form onSubmit={save} className="profile__form" noValidate>
        <FormField label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="name" />
        <button type="submit" className="btn btn--primary" disabled={saving || name.trim() === user.name}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

function PasswordTab() {
  const { updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password';
    const pw = passwordProblem(form.newPassword);
    if (pw) next.newPassword = pw;
    if (form.confirm !== form.newPassword) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError('');
    try {
      toast.success(await updateProfile({ currentPassword: form.currentPassword, newPassword: form.newPassword }));
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile__panel">
      <h2>Change password</h2>
      <InlineAlert>{serverError}</InlineAlert>
      <form onSubmit={save} className="profile__form" noValidate>
        <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={onChange} error={errors.currentPassword} />
        <FormField label="New password" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={onChange} error={errors.newPassword} hint="At least 8 characters with a letter and a number" />
        <FormField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function AddressesTab() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (address) => {
    const { addresses } = editing === 'new' ? await authService.addAddress(address) : await authService.updateAddress(editing._id, address);
    setUser((u) => ({ ...u, addresses }));
    setEditing(null);
    toast.success('Address saved');
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const { addresses } = await authService.deleteAddress(deleting._id);
      setUser((u) => ({ ...u, addresses }));
      toast.success('Address removed');
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile__panel">
      <div className="panel-head">
        <h2>Saved addresses</h2>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing('new')} disabled={user.addresses.length >= 10}>
          <Plus size={16} aria-hidden="true" /> Add address
        </button>
      </div>
      {user.addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" message="Save an address to check out faster." />
      ) : (
        <ul className="address-list">
          {user.addresses.map((address) => (
            <li key={address._id} className="address-card">
              <div>
                <p className="address-card__label">
                  {address.label} {address.isDefault && <span className="badge badge--neutral">Default</span>}
                </p>
                <p>{address.fullName}</p>
                <p className="muted">
                  {address.address}, {address.city}, {address.state} {address.postalCode}, {address.country}
                </p>
                <p className="muted">{address.phone}</p>
              </div>
              <div className="address-card__actions">
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setEditing(address)} aria-label="Edit address">
                  <Pencil size={16} />
                </button>
                <button type="button" className="icon-btn icon-btn--sm" onClick={() => setDeleting(address)} aria-label="Delete address">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'}>
        {editing && <AddressForm initial={editing === 'new' ? undefined : editing} onSubmit={save} submitLabel="Save address" withLabel withDefault />}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Delete address" message="Remove this address from your account?" confirmLabel="Delete" danger loading={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}

function OrdersTab() {
  const { data, loading, error, reload } = useAsync(() => orderService.mine(), []);
  if (loading) return <TableSkeleton rows={3} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const orders = data.orders.slice(0, 5);
  return (
    <div className="profile__panel">
      <div className="panel-head">
        <h2>Recent orders</h2>
        {data.orders.length > 0 && (
          <Link to="/orders" className="link-arrow">
            View all
          </Link>
        )}
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" message="When you place an order it will appear here." actionLabel="Start shopping" actionTo="/shop" />
      ) : (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order._id}>
              <Link to={`/orders/${order._id}`} className="order-row">
                <span>
                  <strong>{order.orderNumber}</strong>
                  <small>{formatDate(order.createdAt)}</small>
                </span>
                <StatusBadge status={order.orderStatus} />
                <span className="order-row__total">{formatPrice(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Profile() {
  useDocumentTitle('My account');
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'account';

  return (
    <div className="container profile">
      <header className="page-header">
        <p className="eyebrow">My account</p>
        <h1>Hello, {user.name.split(' ')[0]}</h1>
      </header>
      <div className="profile__grid">
        <nav className="profile__nav" aria-label="Account sections">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={tab === id ? 'is-active' : ''} onClick={() => setParams({ tab: id })} aria-current={tab === id ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" /> {label}
            </button>
          ))}
          <Link to="/wishlist">
            <Heart size={18} aria-hidden="true" /> Wishlist
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <LayoutDashboard size={18} aria-hidden="true" /> Admin dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut size={18} aria-hidden="true" /> Log out
          </button>
        </nav>
        <section className="card profile__content">
          {tab === 'account' && <AccountTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'addresses' && <AddressesTab />}
          {tab === 'security' && <PasswordTab />}
        </section>
      </div>
    </div>
  );
}
