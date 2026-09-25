import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// The hero banner lives in src/assets/. To use a different banner, replace
// src/assets/orixa-hero.jpg (keep the name) — or save it as orixa-hero.png / .webp;
// the first file matching "orixa-hero.*" is picked up automatically.
const heroFiles = import.meta.glob('../../assets/orixa-hero.*', { eager: true, import: 'default' });
const heroImage = Object.values(heroFiles)[0];

export default function Hero() {
  return (
    <section className="hero" aria-label="ORiXA — Wear your story">
      <div className="hero__media">
        {/* The banner already contains the ORiXA branding, so it is shown in full (never cropped or stretched). */}
        <img
          src={heroImage}
          alt="ORiXA — Wear your story. Premium fabrics, all day comfort, modern designs."
          className="hero__image"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="hero__bar container">
        <p className="hero__eyebrow">New season · Everyday essentials</p>
        <div className="hero__actions">
          <Link to="/shop" className="btn btn--primary btn--lg">
            Shop collection <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link to="/shop?sort=newest" className="btn btn--ghost btn--lg">
            New arrivals
          </Link>
        </div>
      </div>
    </section>
  );
}
