import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ORiXA` : 'ORiXA — Wear Your Story';
  }, [title]);
}
