import { useState } from 'react';
import { PLACEHOLDER_IMAGE } from '../../utils/constants';

// <img> that falls back to a branded placeholder if the URL fails to load.
export default function ProductImage({ src, alt, className = '', loading = 'lazy', ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!src || failed ? PLACEHOLDER_IMAGE : src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
