import { Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState, ErrorState } from '../../components/common/States';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { userService } from '../../services/adminService';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  useDocumentTitle('Users · Admin');
  const { user: me } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const debounced = useDebounce(search.trim(), 350);
  const [confirm, setConfirm] = useState(null); // { type, user }
  const [busy, setBusy] = useState(false);

  const role = params.get('role') || '';
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

  const { data, loading, error, reload, setData } = useAsync(
    () => userService.list({ search: params.get('search') || undefined, role: role || undefined, page, limit: 20 }),
    [params.toString()]
  );

  const replaceUser = (updated) => setData((d) => ({ ...d, users: d.users.map((u) => (u._id === updated._id ? updated : u)) }));

  const run = async () => {
    const { type, user } = confirm;
    setBusy(true);
    try {
      if (type === 'delete') {
        await userService.remove(user._id);
        toast.success('User deleted');
        reload();
      } else if (type === 'role') {
        const { user: updated } = await userService.update(user._id, { role: user.role === 'admin' ? 'user' : 'admin' });
        replaceUser(updated);
        toast.success(`${updated.name} is now ${updated.role === 'admin' ? 'an admin' : 'a customer'}`);
      } else {
        const { user: updated } = await userService.update(user._id, { isActive: !user.isActive });
        replaceUser(updated);
        toast.success(`${updated.name} ${updated.isActive ? 'enabled' : 'disabled'}`);
      }
      setConfirm(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dialogText = () => {
    if (!confirm) return {};
    const { type, user } = confirm;
    if (type === 'delete') return { title: 'Delete user', message: `Permanently delete ${user.name}? Users with orders can only be disabled.`, label: 'Delete', danger: true };
    if (type === 'role')
      return user.role === 'admin'
        ? { title: 'Remove admin access', message: `${user.name} will lose access to the admin dashboard.`, label: 'Make customer', danger: true }
        : { title: 'Make admin', message: `${user.name} will get full access to products, orders and users.`, label: 'Make admin' };
    return user.isActive
      ? { title: 'Disable account', message: `${user.name} will be logged out and cannot sign in until re-enabled.`, label: 'Disable', danger: true }
      : { title: 'Enable account', message: `${user.name} will be able to sign in again.`, label: 'Enable' };
  };
  const text = dialogText();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Users</h1>
        {data && <p className="muted">{data.total} total</p>}
      </header>
      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={16} aria-hidden="true" />
          <label htmlFor="admin-user-search" className="visually-hidden">
            Search users
          </label>
          <input id="admin-user-search" type="search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="sort-select">
          <span className="visually-hidden">Role</span>
          <select value={role} onChange={(e) => setParam('role', e.target.value)}>
            <option value="">All roles</option>
            <option value="user">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </label>
      </div>

      <section className="card card--flush">
        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Registered</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const isMe = user._id === me._id;
                  return (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong> {isMe && <small className="text-muted">(you)</small>}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge--info' : 'badge--neutral'}`}>{user.role === 'admin' ? 'Admin' : 'Customer'}</span>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge--success' : 'badge--danger'}`}>{user.isActive ? 'Active' : 'Disabled'}</span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="table__actions">
                          <button type="button" className="btn btn--ghost btn--sm" disabled={isMe} onClick={() => setConfirm({ type: 'role', user })}>
                            {user.role === 'admin' ? 'Make customer' : 'Make admin'}
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" disabled={isMe} onClick={() => setConfirm({ type: 'active', user })}>
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button type="button" className="icon-btn icon-btn--sm" disabled={isMe} onClick={() => setConfirm({ type: 'delete', user })} aria-label={`Delete ${user.name}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParam('page', n > 1 ? String(n) : '')} />}

      <ConfirmDialog open={Boolean(confirm)} title={text.title} message={text.message} confirmLabel={text.label} danger={text.danger} loading={busy} onConfirm={run} onCancel={() => setConfirm(null)} />
    </div>
  );
}
