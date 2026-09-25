import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { productService } from '../../services/productService';
import { formatPrice, productUrl } from '../../utils/format';
import ProductImage from '../common/ProductImage';
import Spinner from '../common/Spinner';

// Live search: queries GET /api/products?search=... as the user types.
export default function SearchOverlay() {
  const { searchOpen, closeSearch } = useUI();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState({ products: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term.trim(), 300);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  useLockBodyScroll(searchOpen);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && closeSearch();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (!debounced) {
      setResults({ products: [], total: 0 });
      return undefined;
    }
    let active = true;
    setLoading(true);
    productService
      .list({ search: debounced, limit: 6 })
      .then((data) => active && setResults(data))
      .catch(() => active && setResults({ products: [], total: 0 }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debounced]);

  if (!searchOpen) return null;

  const submit = (event) => {
    event.preventDefault();
    if (!term.trim()) return;
    closeSearch();
    navigate(`/shop?search=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="search-overlay__panel">
        <form className="search-overlay__form container" onSubmit={submit} role="search">
          <Search size={22} aria-hidden="true" />
          <label htmlFor="global-search" className="visually-hidden">
            Search products
          </label>
          <input id="global-search" ref={inputRef} type="search" placeholder="Search tees, hoodies, denim…" value={term} onChange={(e) => setTerm(e.target.value)} autoComplete="off" maxLength={100} />
          {loading && <Spinner size="sm" />}
          <button type="button" className="icon-btn" onClick={closeSearch} aria-label="Close search">
            <X size={22} />
          </button>
        </form>

        <div className="search-overlay__results container">
          {debounced && !loading && results.products.length === 0 && <p className="muted">No products match “{debounced}”.</p>}
          {results.products.length > 0 && (
            <>
              <ul className="search-results">
                {results.products.map((product) => (
                  <li key={product._id}>
                    <Link to={productUrl(product)} onClick={closeSearch} className="search-result">
                      <ProductImage src={product.images[0]} alt={product.name} />
                      <span>
                        <strong>{product.name}</strong>
                        <small>{product.category?.name}</small>
                      </span>
                      <span className="search-result__price">{formatPrice(product.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="submit" className="link-btn" onClick={submit}>
                View all {results.total} results <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="search-overlay__backdrop" onClick={closeSearch} aria-hidden="true" />
    </div>
  );
}
