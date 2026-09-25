import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Simple content pages. TODO before launch: have the client review these texts.
const PAGES = {
  shipping: {
    title: 'Shipping & Returns',
    sections: (pricing) => [
      ['Shipping', `Orders over $${pricing.freeShippingThreshold} ship free. Orders below that have a flat shipping fee of $${pricing.shippingFlatRate}. Most orders are delivered within 2–5 business days.`],
      ['Cash on Delivery', 'Pay in cash when your parcel arrives. Please keep the exact amount ready if possible.'],
      ['Returns', 'Unworn items with original tags can be returned within 14 days of delivery. Contact us with your order number to start a return.'],
      ['Cancellations', 'You can cancel an order from your order page while it is Pending or Confirmed. Once it is being processed, please contact us.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: () => [
      ['What we collect', 'Your name, email, shipping addresses and order history — only what we need to process and deliver your orders.'],
      ['How we protect it', 'Passwords are hashed with bcrypt and never stored in plain text. Access to your account is protected by secure, expiring tokens.'],
      ['Newsletter', 'If you subscribe, we use your email only to send ORiXA updates. You can unsubscribe at any time.'],
      ['Your rights', 'You can update your details in your account or contact us to delete your data.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: () => [
      ['Orders', 'All orders are subject to availability. Prices are confirmed by our server at checkout and shown before you place your order.'],
      ['Pricing', 'Prices include applicable discounts. Tax and shipping are shown separately at checkout.'],
      ['Accounts', 'You are responsible for keeping your password secure. We may disable accounts used for fraudulent activity.'],
      ['Contact', 'Questions about these terms? Reach us via the contact page.'],
    ],
  },
};

export default function InfoPage({ page }) {
  const { pricing } = useCart();
  const content = PAGES[page];
  useDocumentTitle(content.title);
  return (
    <div className="container section prose">
      <p className="eyebrow">ORiXA</p>
      <h1>{content.title}</h1>
      {content.sections(pricing).map(([heading, text]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{text}</p>
        </section>
      ))}
      <p>
        Need help? <Link to="/contact">Contact us</Link>.
      </p>
    </div>
  );
}
