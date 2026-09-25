import { EmptyState } from '../components/common/States';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container section">
      <EmptyState title="Page not found" message="The page you are looking for doesn't exist or has moved." actionLabel="Back to home" actionTo="/" />
    </div>
  );
}
