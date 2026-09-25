import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import FormField from '../../components/common/FormField';
import Modal, { ConfirmDialog } from '../../components/common/Modal';
import ProductImage from '../../components/common/ProductImage';
import { TableSkeleton } from '../../components/common/Skeleton';
import { EmptyState, ErrorState, InlineAlert } from '../../components/common/States';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryService } from '../../services/productService';
import { fieldErrorsFrom } from '../../utils/validators';

function CategoryForm({ initial, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '', image: '', active: true, ...initial });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (form.image && !/^https?:\/\/\S+$/i.test(form.image.trim())) next.image = 'Enter a valid image URL';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setServerError('');
    try {
      await onSubmit({ name: form.name.trim(), description: form.description.trim(), image: form.image.trim(), active: form.active });
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <InlineAlert>{serverError}</InlineAlert>
      <FormField label="Name" name="name" value={form.name} onChange={onChange} error={errors.name} maxLength={60} required />
      <FormField label="Description" as="textarea" rows={3} name="description" value={form.description} onChange={onChange} maxLength={500} />
      <FormField label="Image URL" name="image" type="url" value={form.image} onChange={onChange} error={errors.image} placeholder="https://…" />
      <label className="check">
        <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
        <span>Active (shown in the shop)</span>
      </label>
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save category'}
      </button>
    </form>
  );
}

export default function AdminCategories() {
  useDocumentTitle('Categories · Admin');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => categoryService.list({ admin: 'true' }), []);
  const [editing, setEditing] = useState(null); // 'new' | category
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (payload) => {
    if (editing === 'new') await categoryService.create(payload);
    else await categoryService.update(editing._id, payload);
    toast.success('Category saved');
    setEditing(null);
    reload();
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await categoryService.remove(deleting._id);
      toast.success('Category deleted');
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
        <h1>Categories</h1>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden="true" /> Add category
        </button>
      </header>
      <section className="card card--flush">
        {loading && !data ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.categories.length === 0 ? (
          <EmptyState title="No categories yet" actionLabel="Add category" onAction={() => setEditing('new')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Slug</th>
                  <th scope="col" className="num">
                    Active products
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="table__product">
                        <ProductImage src={category.image} alt="" />
                        <span>
                          <strong>{category.name}</strong>
                          <small>{category.description}</small>
                        </span>
                      </div>
                    </td>
                    <td className="mono">{category.slug}</td>
                    <td className="num">{category.productCount}</td>
                    <td>
                      <span className={`badge ${category.active ? 'badge--success' : 'badge--neutral'}`}>{category.active ? 'Active' : 'Hidden'}</span>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => setEditing(category)} aria-label={`Edit ${category.name}`}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => setDeleting(category)} aria-label={`Delete ${category.name}`}>
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

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add category' : 'Edit category'}>
        {editing && <CategoryForm initial={editing === 'new' ? undefined : editing} onSubmit={save} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category"
        message={`Delete “${deleting?.name}”? Categories that still contain products cannot be deleted.`}
        confirmLabel="Delete"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
