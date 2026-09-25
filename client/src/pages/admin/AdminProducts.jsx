import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import ProductImage from '../../components/common/ProductImage';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState, ErrorState } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryService, productService } from '../../services/productService';
import { formatPrice } from '../../utils/format';

export default function AdminProducts() {
  useDocumentTitle('Products · Admin');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const debounced = useDebounce(search.trim(), 350);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const page = Number(params.get('page')) || 1;

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    if (debounced !== (params.get('search') || '')) setParam('search', debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, loading, error, reload } = useAsync(
    () => productService.list({ admin: 'true', search: params.get('search') || '', category, status, page, limit: 15, sort: 'newest' }),
    [params.toString()]
  );
  const categories = useAsync(() => categoryService.list({ admin: 'true' }), []);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await productService.remove(deleting._id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn--primary">
          <Plus size={16} aria-hidden="true" /> Add product
        </Link>
      </header>

      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={16} aria-hidden="true" />
          <label htmlFor="admin-product-search" className="visually-hidden">
            Search products
          </label>
          <input id="admin-product-search" type="search" placeholder="Search name, SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="sort-select">
          <span className="visually-hidden">Category</span>
          <select value={category} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.data?.categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sort-select">
          <span className="visually-hidden">Status</span>
          <select value={status} onChange={(e) => setParam('status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Hidden</option>
          </select>
        </label>
      </div>

      <section className="card card--flush">
        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.products.length === 0 ? (
          <EmptyState title="No products found" message="Try another search or add a new product." actionLabel="Add product" actionTo="/admin/products/new" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="num">
                    Price
                  </th>
                  <th scope="col" className="num">
                    Stock
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="table__product">
                        <ProductImage src={product.images[0]} alt="" />
                        <span>
                          <strong>{product.name}</strong>
                          {product.featured && <small>Featured</small>}
                        </span>
                      </div>
                    </td>
                    <td className="mono">{product.sku}</td>
                    <td>{product.category?.name || '—'}</td>
                    <td className="num">
                      {formatPrice(product.price)}
                      {product.discount > 0 && <small className="text-muted"> −{product.discount}%</small>}
                    </td>
                    <td className={`num ${product.stock === 0 ? 'text-danger' : product.stock <= 5 ? 'text-warning' : ''}`}>{product.stock}</td>
                    <td>
                      <span className={`badge ${product.active ? 'badge--success' : 'badge--neutral'}`}>{product.active ? 'Active' : 'Hidden'}</span>
                    </td>
                    <td>
                      <div className="table__actions">
                        <Link to={`/admin/products/${product._id}/edit`} className="icon-btn icon-btn--sm" aria-label={`Edit ${product.name}`}>
                          <Pencil size={16} />
                        </Link>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => setDeleting(product)} aria-label={`Delete ${product.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {data && <Pagination page={data.page} pages={data.pages} onChange={(n) => setParam('page', n > 1 ? String(n) : '')} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product"
        message={`Delete “${deleting?.name}”? Past orders keep their own copy of the product details. To hide it from the shop instead, edit it and turn off “Active”.`}
        confirmLabel="Delete"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
