import { AlertTriangle, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// Reusable empty / error states.
export function EmptyState({ icon: Icon = PackageOpen, title, message, actionLabel, actionTo, onAction, children }) {
  return (
    <div className="state">
      <Icon className="state__icon" size={40} strokeWidth={1.25} aria-hidden="true" />
      <h2 className="state__title">{title}</h2>
      {message && <p className="state__message">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" className="btn btn--primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <AlertTriangle className="state__icon" size={40} strokeWidth={1.25} aria-hidden="true" />
      <h2 className="state__title">{title}</h2>
      <p className="state__message">{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function InlineAlert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
