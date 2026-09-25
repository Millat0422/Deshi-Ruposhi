import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductImage from '../common/ProductImage';

export default function PromoBanner({ image }) {
  return (
    <section className="promo" aria-labelledby="promo-title">
      <div className="container promo__inner">
        <div className="promo__content">
          <p className="eyebrow eyebrow--light">The capsule edit</p>
          <h2 id="promo-title">Everyday Essentials</h2>
          <p>Heavyweight tees, brushed fleece and easy layers — the quiet foundations of a wardrobe that works every day.</p>
          <Link to="/shop?category=t-shirts,hoodies" className="btn btn--light btn--lg">
            Shop now <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="promo__media">
          <ProductImage src={image} alt="ORiXA everyday essentials" />
        </div>
      </div>
    </section>
  );
}
