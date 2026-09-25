export function Skeleton({ className = '', style }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton" aria-hidden="true">
      <Skeleton className="skeleton--image" />
      <Skeleton className="skeleton--line" style={{ width: '40%' }} />
      <Skeleton className="skeleton--line" style={{ width: '80%' }} />
      <Skeleton className="skeleton--line" style={{ width: '30%' }} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="skeleton--row" />
      ))}
    </div>
  );
}
