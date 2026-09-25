const TONES = {
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'info',
  Shipped: 'info',
  Delivered: 'success',
  Cancelled: 'danger',
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
  cancelled: 'neutral',
};

export default function StatusBadge({ status, children }) {
  return <span className={`badge badge--${TONES[status] || 'neutral'}`}>{children || status}</span>;
}
