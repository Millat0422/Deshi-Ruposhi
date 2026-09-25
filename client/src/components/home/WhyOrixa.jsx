import { Feather, Gem, Scissors, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { Icon: Gem, title: 'Premium Fabrics', text: 'Combed cottons, brushed fleece and durable twills chosen to last.' },
  { Icon: Feather, title: 'All Day Comfort', text: 'Relaxed, considered fits that move with you from morning to night.' },
  { Icon: Scissors, title: 'Modern Designs', text: 'Clean lines and a neutral palette that pairs with everything.' },
  { Icon: ShieldCheck, title: 'Secure Shopping', text: 'Protected accounts, transparent pricing and cash on delivery.' },
];

export default function WhyOrixa() {
  return (
    <section className="section container" aria-labelledby="why-title">
      <div className="section-heading section-heading--center">
        <div>
          <p className="eyebrow">Why ORiXA</p>
          <h2 id="why-title">Made to be lived in</h2>
        </div>
      </div>
      <ul className="features">
        {FEATURES.map(({ Icon, title, text }) => (
          <li key={title} className="feature">
            <span className="feature__icon">
              <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
