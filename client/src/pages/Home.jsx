import CategoryCards from '../components/home/CategoryCards';
import Hero from '../components/home/Hero';
import NewsletterForm from '../components/home/Newsletter';
import ProductSection from '../components/home/ProductSection';
import PromoBanner from '../components/home/PromoBanner';
import WhyOrixa from '../components/home/WhyOrixa';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { categoryService, productService } from '../services/productService';

export default function Home() {
  useDocumentTitle();

  const featured = useAsync(() => productService.list({ featured: 'true', sort: 'popular', limit: 8 }), []);
  const arrivals = useAsync(() => productService.list({ sort: 'newest', limit: 4 }), []);
  const categories = useAsync(() => categoryService.list(), []);
  const spotlight = useAsync(
    () => Promise.all([productService.list({ gender: 'women', sort: 'popular', limit: 1 }), productService.list({ gender: 'men', sort: 'popular', limit: 1 })]),
    []
  );

  const [women, men] = spotlight.data || [];
  const promoImage = featured.data?.products?.find((p) => p.category?.slug === 'hoodies')?.images?.[0] || featured.data?.products?.[0]?.images?.[0];

  return (
    <>
      <Hero />

      <CategoryCards
        categories={categories.data?.categories}
        loading={categories.loading}
        womenImage={women?.products?.[0]?.images?.[0]}
        menImage={men?.products?.[0]?.images?.[0]}
      />

      <ProductSection
        id="featured-title"
        eyebrow="Curated"
        title="Featured pieces"
        linkTo="/shop?featured=true"
        products={featured.data?.products}
        loading={featured.loading}
        error={featured.error}
        onRetry={featured.reload}
        tone="soft"
      />

      <ProductSection
        id="arrivals-title"
        eyebrow="Just landed"
        title="New arrivals"
        linkTo="/shop?sort=newest"
        products={arrivals.data?.products}
        loading={arrivals.loading}
        error={arrivals.error}
        onRetry={arrivals.reload}
      />

      <PromoBanner image={promoImage} />

      <WhyOrixa />

      <section className="newsletter section--soft" aria-labelledby="newsletter-title">
        <div className="container newsletter__inner">
          <p className="eyebrow">Newsletter</p>
          <h2 id="newsletter-title">Join the ORiXA community</h2>
          <p className="muted">Be first to hear about new collections, restocks and members-only offers.</p>
          <NewsletterForm variant="section" />
        </div>
      </section>
    </>
  );
}
