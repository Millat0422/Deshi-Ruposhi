import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductImage from '../common/ProductImage';
import { Skeleton } from '../common/Skeleton';
import SectionHeading from './SectionHeading';

// Men/Women link to gender filters; the rest use real categories from the API.
const FEATURED = [
  { key: 'men', title: "Men's Fashion", to: '/shop?gender=men', fromCategory: 'shirts-and-polos' },
  { key: 'women', title: "Women's Fashion", to: '/shop?gender=women', fromCategory: 'bottoms' },
  { key: 't-shirts', title: 'T-Shirts', to: '/shop?category=t-shirts', fromCategory: 't-shirts' },
  { key: 'hoodies', title: 'Hoodies', to: '/shop?category=hoodies', fromCategory: 'hoodies' },
  { key: 'accessories', title: 'Accessories', to: '/shop?category=accessories', fromCategory: 'accessories' },
];

export default function CategoryCards({ categories, loading, womenImage, menImage }) {
  const bySlug = new Map((categories || []).map((c) => [c.slug, c]));
  const imageFor = (item) => {
    if (item.key === 'women' && womenImage) return womenImage;
    if (item.key === 'men' && menImage) return menImage;
    return bySlug.get(item.fromCategory)?.image;
  };
  const cards = FEATURED.filter((item) => item.key === 'men' || item.key === 'women' || bySlug.has(item.fromCategory));

  return (
    <section className="section container" id="collections" aria-labelledby="categories-title">
      <SectionHeading eyebrow="Explore" title="Shop by category" id="categories-title" linkTo="/shop" linkLabel="All products" />
      <div className="category-grid">
        {loading
          ? FEATURED.map((item) => <Skeleton key={item.key} className="category-card skeleton--card" />)
          : cards.map((item, index) => (
              <Link key={item.key} to={item.to} className={`category-card ${index < 2 ? 'category-card--large' : ''}`}>
                <ProductImage src={imageFor(item)} alt="" />
                <span className="category-card__label">
                  {item.title}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
