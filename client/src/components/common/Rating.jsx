import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14, showValue = true }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="rating" aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ''}`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={size} className={star <= rounded ? 'is-filled' : star - 0.5 === rounded ? 'is-half' : ''} />
        ))}
      </span>
      {showValue && <span className="rating__value">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="rating__count">({count})</span>}
    </span>
  );
}
