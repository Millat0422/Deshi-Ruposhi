import { useCart } from '../../context/CartContext';

export default function AnnouncementBar() {
  const { pricing } = useCart();
  return (
    <div className="announcement" role="region" aria-label="Announcement">
      <p>Free shipping on orders over ${pricing.freeShippingThreshold} · Cash on delivery available</p>
    </div>
  );
}
