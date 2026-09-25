import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import ProductImage from '../../components/common/ProductImage';
import { PageLoader } from '../../components/common/Spinner';
import { ErrorState, InlineAlert } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryService, productService } from '../../services/productService';
import { SIZE_OPTIONS } from '../../utils/constants';
import { fieldErrorsFrom } from '../../utils/validators';

const EMPTY = {
  name: '',
  description: '',
  category: '',
  gender: 'unisex',
  price: '',
  originalPrice: '',
  stock: '',
  sku: '',
  brand: 'ORiXA',
  images: [''],
  sizes: [],
  colors: [],
  featured: false,
  active: true,
};

const isUrl = (value) => /^https?:\/\/\S+$/i.test(value) || value.startsWith('/');

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!form.category) errors.category = 'Choose a category';
  if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) errors.price = 'Price must be 0 or more';
  if (form.originalPrice !== '' && (Number(form.originalPrice) < 0 || Number.isNaN(Number(form.originalPrice)))) errors.originalPrice = 'Original price must be 0 or more';
  else if (form.originalPrice !== '' && Number(form.originalPrice) > 0 && Number(form.originalPrice) < Number(form.price))
    errors.originalPrice = 'Original price should be higher than the price (or leave empty)';
  if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) errors.stock = 'Stock must be a whole number of 0 or more';
  if (!/^[A-Za-z0-9-_]{2,40}$/.test(form.sku.trim())) errors.sku = 'SKU: 2-40 letters, numbers, - or _';
  const images = form.images.map((i) => i.trim()).filter(Boolean);
  if (images.length === 0) errors.images = 'Add at least one image URL';
  else if (images.some((i) => !isUrl(i))) errors.images = 'Every image must be a valid http(s) URL';
  if (form.colors.some((c) => !c.name.trim())) errors.colors = 'Every color needs a name';
  return errors;
};

export default function AdminProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle(isNew ? 'New product · Admin' : 'Edit product · Admin');

  const categories = useAsync(() => categoryService.list({ admin: 'true' }), []);
  const existing = useAsync(() => (isNew ? Promise.resolve(null) : productService.get(id)), [id]);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const product = existing.data?.product;
    if (!product) return;
    setForm({
      ...EMPTY,
      ...product,
      category: product.category?._id || '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      stock: String(product.stock),
      images: product.images.length ? product.images : [''],
    });
  }, [existing.data]);

  if (existing.loading || categories.loading) return <PageLoader />;
  if (existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };
  const onChange = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

  const discount = Number(form.originalPrice) > Number(form.price) && Number(form.price) >= 0 ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100) : 0;

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setServerError('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    setServerError('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      gender: form.gender,
      price: Number(form.price),
      originalPrice: form.originalPrice === '' ? 0 : Number(form.originalPrice),
      stock: Number(form.stock),
      sku: form.sku.trim().toUpperCase(),
      brand: form.brand.trim() || 'ORiXA',
      images: form.images.map((i) => i.trim()).filter(Boolean),
      sizes: SIZE_OPTIONS.filter((s) => form.sizes.includes(s)),
      colors: form.colors.map((c) => ({ name: c.name.trim(), hex: c.hex })),
      featured: form.featured,
      active: form.active,
    };
    try {
      if (isNew) await productService.create(payload);
      else await productService.update(id, payload);
      toast.success(isNew ? 'Product created' : 'Product updated');
      navigate('/admin/products');
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <Link to="/admin/products" className="link-btn">
        <ChevronLeft size={16} aria-hidden="true" /> Products
      </Link>
      <header className="admin-page__header">
        <h1>{isNew ? 'Add product' : `Edit: ${existing.data?.product?.name}`}</h1>
      </header>

      <form className="product-form" onSubmit={submit} noValidate>
        <InlineAlert>{serverError}</InlineAlert>
        <div className="product-form__grid">
          <section className="card">
            <h2>Details</h2>
            <FormField label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} maxLength={120} required />
            <FormField label="Description" as="textarea" rows={5} name="description" value={form.description} onChange={onChange} error={errors.description} maxLength={3000} required />
            <div className="form-grid">
              <FormField label="Category" as="select" name="category" value={form.category} onChange={onChange} error={errors.category} required>
                <option value="">Select a category</option>
                {categories.data?.categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </FormField>
              <FormField label="Gender" as="select" name="gender" value={form.gender} onChange={onChange}>
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </FormField>
              <FormField label="SKU" name="sku" value={form.sku} onChange={onChange} error={errors.sku} maxLength={40} required />
              <FormField label="Brand" name="brand" value={form.brand} onChange={onChange} maxLength={60} />
            </div>
          </section>

          <section className="card">
            <h2>Pricing & stock</h2>
            <div className="form-grid">
              <FormField label="Price (USD)" name="price" type="number" min="0" step="0.01" value={form.price} onChange={onChange} error={errors.price} required />
              <FormField label="Original price (optional)" name="originalPrice" type="number" min="0" step="0.01" value={form.originalPrice} onChange={onChange} error={errors.originalPrice} hint={discount ? `Shows a ${discount}% discount` : 'Set higher than price to show a discount'} />
              <FormField label="Stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={onChange} error={errors.stock} required />
            </div>
            <label className="check">
              <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
              <span>Active (visible in the shop)</span>
            </label>
            <label className="check">
              <input type="checkbox" name="featured" checked={form.featured} onChange={onChange} />
              <span>Featured on the homepage</span>
            </label>
          </section>

          <section className="card">
            <h2>Images</h2>
            <p className="muted small">Paste image URLs (e.g. from Cloudinary or your CDN). The first image is the main one.</p>
            <ul className="image-inputs">
              {form.images.map((url, index) => (
                <li key={index}>
                  <ProductImage src={url} alt="" className="image-inputs__preview" />
                  <label className="visually-hidden" htmlFor={`image-${index}`}>
                    Image URL {index + 1}
                  </label>
                  <input
                    id={`image-${index}`}
                    type="url"
                    placeholder="https://…"
                    value={url}
                    onChange={(e) => set('images', form.images.map((u, i) => (i === index ? e.target.value : u)))}
                  />
                  <button type="button" className="icon-btn icon-btn--sm" onClick={() => set('images', form.images.length > 1 ? form.images.filter((_, i) => i !== index) : [''])} aria-label={`Remove image ${index + 1}`}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {errors.images && <p className="field__error">{errors.images}</p>}
            <button type="button" className="btn btn--outline btn--sm" onClick={() => set('images', [...form.images, ''])} disabled={form.images.length >= 8}>
              <Plus size={14} aria-hidden="true" /> Add image
            </button>
          </section>

          <section className="card">
            <h2>Variants</h2>
            <fieldset className="fieldset">
              <legend className="field__label">Sizes (leave empty if the product has no sizes)</legend>
              <div className="chips">
                {SIZE_OPTIONS.map((size) => {
                  const active = form.sizes.includes(size);
                  return (
                    <button key={size} type="button" className={`chip chip--size ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={() => set('sizes', active ? form.sizes.filter((s) => s !== size) : [...form.sizes, size])}>
                      {size}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="field__label">Colors</legend>
              <ul className="color-inputs">
                {form.colors.map((color, index) => (
                  <li key={index}>
                    <label className="visually-hidden" htmlFor={`color-hex-${index}`}>
                      Color swatch {index + 1}
                    </label>
                    <input id={`color-hex-${index}`} type="color" value={color.hex} onChange={(e) => set('colors', form.colors.map((c, i) => (i === index ? { ...c, hex: e.target.value } : c)))} />
                    <label className="visually-hidden" htmlFor={`color-name-${index}`}>
                      Color name {index + 1}
                    </label>
                    <input id={`color-name-${index}`} placeholder="Color name" value={color.name} maxLength={30} onChange={(e) => set('colors', form.colors.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)))} />
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => set('colors', form.colors.filter((_, i) => i !== index))} aria-label={`Remove color ${index + 1}`}>
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {errors.colors && <p className="field__error">{errors.colors}</p>}
              <button type="button" className="btn btn--outline btn--sm" onClick={() => set('colors', [...form.colors, { name: '', hex: '#111111' }])} disabled={form.colors.length >= 12}>
                <Plus size={14} aria-hidden="true" /> Add color
              </button>
            </fieldset>
          </section>
        </div>

        <div className="product-form__actions">
          <Link to="/admin/products" className="btn btn--ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
