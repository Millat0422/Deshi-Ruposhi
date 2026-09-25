import { Link } from 'react-router-dom';

// Text wordmark used in the navbar/footer. Replace with an <img> of the official logo if preferred.
export default function Logo({ className = '', onClick }) {
  return (
    <Link to="/" className={`logo ${className}`} onClick={onClick} aria-label="ORiXA home">
      OR<span className="logo__i">i</span>XA
    </Link>
  );
}
