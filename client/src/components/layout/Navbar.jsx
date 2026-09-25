import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { useWishlist } from '../../context/WishlistContext';
import Logo from '../common/Logo';

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop', end: true },
  { to: '/shop?gender=men', label: 'Men' },
  { to: '/shop?gender=women', label: 'Women' },
  { to: '/shop?featured=true', label: 'Collections' },
  { to: '/about', label: 'About' },
];

// NavLink doesn't compare query strings, so we decide "active" ourselves.
const useIsActive = () => {
  const location = useLocation();
  return (to) => {
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    const current = new URLSearchParams(location.search);
    if (!query) return path !== '/shop' || (!current.get('gender') && !current.get('featured'));
    const wanted = new URLSearchParams(query);
    return [...wanted.entries()].every(([key, value]) => current.get(key) === value);
  };
};

export default function Navbar() {
  const { totals } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { openCart, openSearch, openMenu } = useUI();
  const isActive = useIsActive();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="navbar__inner container">
        <button type="button" className="icon-btn navbar__burger" onClick={openMenu} aria-label="Open menu">
          <Menu size={22} />
        </button>

        <Logo className="navbar__logo" />

        <nav className="navbar__links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} className={() => `navbar__link ${isActive(link.to) ? 'is-active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <button type="button" className="icon-btn hide-mobile" onClick={openSearch} aria-label="Search products">
            <Search size={20} />
          </button>
          <Link to={isAuthenticated ? '/profile' : '/login'} className="icon-btn hide-mobile" aria-label={isAuthenticated ? 'My account' : 'Log in'}>
            <User size={20} />
          </Link>
          <Link to="/wishlist" className="icon-btn hide-mobile" aria-label={`Wishlist, ${wishlistCount} items`}>
            <Heart size={20} />
            {wishlistCount > 0 && <span className="icon-btn__badge">{wishlistCount}</span>}
          </Link>
          <button type="button" className="icon-btn" onClick={openCart} aria-label={`Shopping bag, ${totals.itemCount} items`}>
            <ShoppingBag size={20} />
            {totals.itemCount > 0 && <span className="icon-btn__badge">{totals.itemCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
