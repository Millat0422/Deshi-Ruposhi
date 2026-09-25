import { Heart, LayoutDashboard, LogOut, Package, Search, User, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import Logo from '../common/Logo';

export default function MobileMenu({ links }) {
  const { menuOpen, closeMenu, openSearch } = useUI();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useLockBodyScroll(menuOpen);

  // Close when the route changes.
  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <div className={`overlay ${menuOpen ? 'is-open' : ''}`} onClick={closeMenu} aria-hidden="true" />
      <aside className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-label="Mobile menu" aria-hidden={!menuOpen} inert={menuOpen ? undefined : ''}>
        <div className="mobile-menu__header">
          <Logo onClick={closeMenu} />
          <button type="button" className="icon-btn" onClick={closeMenu} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <button type="button" className="mobile-menu__search" onClick={openSearch}>
          <Search size={18} /> Search products
        </button>

        <nav className="mobile-menu__links" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.label} to={link.to} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>
        </nav>

        <div className="mobile-menu__account">
          {user ? (
            <>
              <p className="mobile-menu__hello">Hello, {user.name.split(' ')[0]}</p>
              <Link to="/profile" onClick={closeMenu}>
                <User size={18} /> My account
              </Link>
              <Link to="/orders" onClick={closeMenu}>
                <Package size={18} /> Orders
              </Link>
              <Link to="/wishlist" onClick={closeMenu}>
                <Heart size={18} /> Wishlist
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu}>
                  <LayoutDashboard size={18} /> Admin dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeMenu();
                  navigate('/');
                }}
              >
                <LogOut size={18} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--primary btn--block" onClick={closeMenu}>
                Log in
              </Link>
              <Link to="/register" className="btn btn--outline btn--block" onClick={closeMenu}>
                Create account
              </Link>
              <Link to="/wishlist" onClick={closeMenu}>
                <Heart size={18} /> Wishlist
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
