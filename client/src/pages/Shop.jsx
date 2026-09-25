import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/common/Pagination';
import { EmptyState, ErrorState } from '../components/common/States';
import ProductGrid from '../components/product/ProductGrid';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { categoryService, productService } from '../services/productService';
import { SORT_OPTIONS } from '../utils/constants';
import { pluralize } from '../utils/format';

const PAGE_SIZE = 12;
const FILTER_KEYS = ['search', 'category', 'gender', 'minPrice', 'maxPrice', 'size', 'color', 'featured'];

const toggleInList = (value, item) => {
  const list = value ? value.split(',') : [];
  return (list.includes(item) ? list.filter((v) => v !== item) : [...list, item]).join(',');
};

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  useLockBodyScroll(filtersOpen);

  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const page = Number(query.page) || 1;
  const sort = query.sort || 'newest';

  // Search box is local state, pushed to the URL after the user stops typing.
  const [searchInput, setSearchInput] = useState(query.search || '');
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  useEffect(() => setSearchInput(query.search || ''), [query.search]);

  // Price inputs, applied on blur / Enter.
  const [price, setPrice] = useState({ min: query.minPrice || '', max: query.maxPrice || '' });
  useEffect(() => setPrice({ min: query.minPrice || '', max: query.maxPrice || '' }), [query.minPrice, query.maxPrice]);

  const update = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === undefined || value === null) next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    if (debouncedSearch !== (query.search || '')) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const products = useAsync(() => productService.list({ ...query, sort, page, limit: PAGE_SIZE }), [params.toString()]);
  const categories = useAsync(() => categoryService.list(), []);
  const facets = useAsync(() => productService.filters(), []);

  const title = query.featured ? 'The Collection' : query.gender === 'men' ? 'Men' : query.gender === 'women' ? 'Women' : query.search ? `Results for “${query.search}”` : 'Shop all';
  useDocumentTitle(title);

  const activeFilterCount = FILTER_KEYS.filter((key) => query[key] && key !== 'search').length;
  const applyPrice = () => {
    const min = price.min !== '' ? Math.max(0, Number(price.min)) : '';
    const max = price.max !== '' ? Math.max(0, Number(price.max)) : '';
    update({ minPrice: min === '' ? '' : String(min), maxPrice: max === '' ? '' : String(max) });
  };
  const clearAll = () => {
    setSearchInput('');
    setParams(sort !== 'newest' ? { sort } : {});
  };

  const data = products.data;

  const filterPanel = (
    <div className="filters">
      <div className="filters__group">
        <h3>Category</h3>
        <ul>
          {(categories.data?.categories || []).map((category) => (
            <li key={category._id}>
              <label className="check">
                <input type="checkbox" checked={(query.category || '').split(',').includes(category.slug)} onChange={() => update({ category: toggleInList(query.category, category.slug) })} />
                <span>{category.name}</span>
                <small>{category.productCount}</small>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="filters__group">
        <h3>Gender</h3>
        <div className="chips">
          {[
            { value: '', label: 'All' },
            { value: 'men', label: 'Men' },
            { value: 'women', label: 'Women' },
          ].map((option) => (
            <button key={option.label} type="button" className={`chip ${(query.gender || '') === option.value ? 'is-active' : ''}`} onClick={() => update({ gender: option.value })} aria-pressed={(query.gender || '') === option.value}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <h3>Price</h3>
        <form
          className="price-range"
          onSubmit={(e) => {
            e.preventDefault();
            applyPrice();
          }}
        >
          <label>
            <span className="visually-hidden">Minimum price</span>
            <input type="number" min="0" inputMode="decimal" placeholder={`$${facets.data?.minPrice ?? 0}`} value={price.min} onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))} onBlur={applyPrice} />
          </label>
          <span aria-hidden="true">–</span>
          <label>
            <span className="visually-hidden">Maximum price</span>
            <input type="number" min="0" inputMode="decimal" placeholder={`$${facets.data?.maxPrice ?? 200}`} value={price.max} onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))} onBlur={applyPrice} />
          </label>
          <button type="submit" className="visually-hidden">
            Apply price
          </button>
        </form>
      </div>

      {facets.data?.sizes?.length > 0 && (
        <div className="filters__group">
          <h3>Size</h3>
          <div className="chips">
            {facets.data.sizes.map((size) => {
              const active = (query.size || '').split(',').includes(size);
              return (
                <button key={size} type="button" className={`chip chip--size ${active ? 'is-active' : ''}`} onClick={() => update({ size: toggleInList(query.size, size) })} aria-pressed={active}>
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {facets.data?.colors?.length > 0 && (
        <div className="filters__group">
          <h3>Color</h3>
          <div className="chips">
            {facets.data.colors.map((color) => {
              const active = (query.color || '').split(',').includes(color.name);
              return (
                <button key={color.name} type="button" className={`chip chip--color ${active ? 'is-active' : ''}`} onClick={() => update({ color: toggleInList(query.color, color.name) })} aria-pressed={active}>
                  <span className="swatch" style={{ background: color.hex }} aria-hidden="true" />
                  {color.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button type="button" className="btn btn--ghost btn--block" onClick={clearAll}>
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="shop container">
      <header className="page-header">
        <p className="eyebrow">ORiXA</p>
        <h1>{title}</h1>
        {data && <p className="muted">{pluralize(data.total, 'product')}</p>}
      </header>

      <div className="shop__toolbar">
        <div className="search-input">
          <Search size={18} aria-hidden="true" />
          <label htmlFor="shop-search" className="visually-hidden">
            Search products
          </label>
          <input id="shop-search" type="search" placeholder="Search products, SKU…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} maxLength={100} />
          {searchInput && (
            <button type="button" onClick={() => setSearchInput('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <button type="button" className="btn btn--outline shop__filter-btn" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={16} aria-hidden="true" /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        <label className="sort-select">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="shop__layout">
        <aside className="shop__sidebar" aria-label="Product filters">
          {filterPanel}
        </aside>

        <section className="shop__results" aria-live="polite" aria-busy={products.loading}>
          {products.error ? (
            <ErrorState error={products.error} onRetry={products.reload} />
          ) : !products.loading && data?.products.length === 0 ? (
            <EmptyState title="No products found" message="Try a different search or remove some filters." actionLabel="Clear filters" onAction={clearAll} />
          ) : (
            <>
              <ProductGrid products={data?.products} loading={products.loading && !data} skeletonCount={PAGE_SIZE} columns={3} />
              {data && (
                <Pagination
                  page={data.page}
                  pages={data.pages}
                  onChange={(n) => {
                    update({ page: n > 1 ? String(n) : '' }, { resetPage: false });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      <div className={`overlay ${filtersOpen ? 'is-open' : ''}`} onClick={() => setFiltersOpen(false)} aria-hidden="true" />
      <aside className={`drawer drawer--left ${filtersOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Filters" aria-hidden={!filtersOpen} inert={filtersOpen ? undefined : ''}>
        <header className="drawer__header">
          <h2>Filters</h2>
          <button type="button" className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <X size={22} />
          </button>
        </header>
        <div className="drawer__scroll">{filterPanel}</div>
        <footer className="drawer__footer">
          <button type="button" className="btn btn--primary btn--block" onClick={() => setFiltersOpen(false)}>
            Show {data ? pluralize(data.total, 'product') : 'products'}
          </button>
        </footer>
      </aside>
    </div>
  );
}
