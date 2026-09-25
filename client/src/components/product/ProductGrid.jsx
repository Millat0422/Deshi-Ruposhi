import { ProductCardSkeleton } from '../common/Skeleton';
import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], loading, skeletonCount = 8, columns = 4 }) {
  return (
    <div className={`product-grid product-grid--${columns}`}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  );
}
