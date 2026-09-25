import { ArrowLeft, FolderTree, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/orders', label: 'Orders', Icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/categories', label: 'Categories', Icon: FolderTree },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="admin">
      <a href="#admin-main" className="skip-link">
        Skip to content
      </a>
      <aside className={`admin__sidebar ${open ? 'is-open' : ''}`} aria-label="Admin navigation">
        <div className="admin__brand">
          <Link to="/admin" className="logo logo--light">
            OR<span className="logo__i">i</span>XA
          </Link>
          <span className="admin__badge">Admin</span>
          <button type="button" className="icon-btn icon-btn--light admin__close" onClick={() => setOpen(false)} aria-label="Close admin menu">
            <X size={20} />
          </button>
        </div>
        <nav className="admin__nav">
          {LINKS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__sidebar-footer">
          <Link to="/">
            <ArrowLeft size={16} aria-hidden="true" /> Back to store
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>
      {open && <div className="overlay is-open admin__overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="admin__content">
        <header className="admin__topbar">
          <button type="button" className="icon-btn admin__burger" onClick={() => setOpen(true)} aria-label="Open admin menu">
            <Menu size={22} />
          </button>
          <p className="admin__hello">
            Signed in as <strong>{user?.name}</strong>
          </p>
        </header>
        <main id="admin-main" className="admin__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
