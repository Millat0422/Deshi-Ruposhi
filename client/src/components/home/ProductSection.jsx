import { ErrorState } from '../common/States';
import ProductGrid from '../product/ProductGrid';
import SectionHeading from './SectionHeading';

export default function ProductSection({ id, eyebrow, title, linkTo, products, loading, error, onRetry, tone }) {
  return (
    <section className={`section ${tone === 'soft' ? 'section--soft' : ''}`} aria-labelledby={id}>
      <div className="container">
        <SectionHeading id={id} eyebrow={eyebrow} title={title} linkTo={linkTo} />
        {error ? <ErrorState error={error} onRetry={onRetry} /> : <ProductGrid products={products} loading={loading} skeletonCount={4} />}
      </div>
    </section>
  );
}
