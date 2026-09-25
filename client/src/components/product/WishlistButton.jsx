import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';

export default function WishlistButton({ product, className = '', withLabel = false }) {
  const { isInWishlist, toggle } = useWishlist();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const active = isInWishlist(product._id);

  const onClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);
    try {
      const added = await toggle(product);
      toast.success(added ? 'Saved to your wishlist' : 'Removed from your wishlist');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-btn ${active ? 'is-active' : ''} ${withLabel ? 'btn btn--outline' : ''} ${className}`}
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
    >
      <Heart size={18} fill={active ? 'currentColor' : 'none'} />
      {withLabel && <span>{active ? 'Saved' : 'Wishlist'}</span>}
    </button>
  );
}
