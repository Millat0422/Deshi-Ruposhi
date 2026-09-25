import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// TODO before launch: replace the contact details below with the brand's real ones.
const CONTACT = {
  email: 'hello@orixa.com',
  phone: '+880 1700-000000',
  address: 'Gulshan Avenue, Dhaka 1212, Bangladesh',
  hours: 'Saturday – Thursday, 10:00 – 19:00',
};

export default function Contact() {
  useDocumentTitle('Contact');
  return (
    <div className="container section contact">
      <header className="page-header">
        <p className="eyebrow">Customer service</p>
        <h1>Contact us</h1>
        <p className="muted">Questions about sizing, an order or a return? We are happy to help.</p>
      </header>
      <ul className="contact__grid">
        <li className="card">
          <Mail size={22} aria-hidden="true" />
          <h2>Email</h2>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <p className="muted small">We reply within one business day.</p>
        </li>
        <li className="card">
          <Phone size={22} aria-hidden="true" />
          <h2>Phone</h2>
          <a href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`}>{CONTACT.phone}</a>
        </li>
        <li className="card">
          <MapPin size={22} aria-hidden="true" />
          <h2>Studio</h2>
          <p>{CONTACT.address}</p>
        </li>
        <li className="card">
          <Clock size={22} aria-hidden="true" />
          <h2>Hours</h2>
          <p>{CONTACT.hours}</p>
        </li>
      </ul>
      <p className="muted">
        Tip: include your order number (it starts with <strong>ORX-</strong>) so we can help faster.
      </p>
    </div>
  );
}
