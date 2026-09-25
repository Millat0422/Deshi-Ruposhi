import { Facebook, Instagram, Mail, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewsletterForm from '../home/Newsletter';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'All products' },
      { to: '/shop?gender=men', label: 'Men' },
      { to: '/shop?gender=women', label: 'Women' },
      { to: '/shop?category=accessories', label: 'Accessories' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { to: '/contact', label: 'Contact' },
      { to: '/shipping-returns', label: 'Shipping & Returns' },
      { to: '/orders', label: 'Track your order' },
      { to: '/profile', label: 'My account' },
    ],
  },
  {
    title: 'ORiXA',
    links: [
      { to: '/about', label: 'About' },
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms & Conditions' },
    ],
  },
];

// TODO before launch: point these to the brand's real social profiles.
const SOCIALS = [
  { href: 'https://www.instagram.com/', label: 'Instagram', Icon: Instagram },
  { href: 'https://www.facebook.com/', label: 'Facebook', Icon: Facebook },
  { href: 'https://www.youtube.com/', label: 'YouTube', Icon: Youtube },
  { href: 'mailto:hello@orixa.com', label: 'Email', Icon: Mail },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <p className="footer__logo">
            OR<span className="logo__i">i</span>XA
          </p>
          <p className="footer__tagline">Wear your story.</p>
          <p className="footer__text">Premium everyday clothing made from considered fabrics, designed to be lived in.</p>
          <ul className="footer__socials">
            {SOCIALS.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" aria-label={label}>
                  <Icon size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} className="footer__col" aria-label={column.title}>
            <h3>{column.title}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="footer__newsletter">
          <h3>Newsletter</h3>
          <p>New drops and members-only offers. No spam.</p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="footer__bottom container">
        <p>© {new Date().getFullYear()} ORiXA. All rights reserved.</p>
        <p>Cash on Delivery · Secure checkout</p>
      </div>
    </footer>
  );
}
