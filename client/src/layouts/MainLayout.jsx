import { Outlet } from 'react-router-dom';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import CartDrawer from '../components/layout/CartDrawer';
import Footer from '../components/layout/Footer';
import MobileMenu from '../components/layout/MobileMenu';
import Navbar, { NAV_LINKS } from '../components/layout/Navbar';
import SearchOverlay from '../components/layout/SearchOverlay';

export default function MainLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar />
      <main id="main" className="app-main">
        <Outlet />
      </main>
      <Footer />
      {/* Rendered outside the sticky header: its backdrop-filter would trap position:fixed children. */}
      <MobileMenu links={NAV_LINKS} />
      <CartDrawer />
      <SearchOverlay />
    </div>
  );
}
