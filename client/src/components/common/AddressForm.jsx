import { useState } from 'react';
import { ADDRESS_FIELDS, EMPTY_ADDRESS, fieldErrorsFrom, validateAddress } from '../../utils/validators';
import FormField from './FormField';
import { InlineAlert } from './States';

// Shared by checkout and the profile "Saved addresses" section.
export default function AddressForm({ initial, onSubmit, submitLabel = 'Continue', withLabel = false, withDefault = false, children }) {
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, label: 'Home', isDefault: false, ...initial });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddress((a) => ({ ...a, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateAddress(address);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = Object.fromEntries(ADDRESS_FIELDS.map(({ name }) => [name, address[name].trim()]));
    if (withLabel) payload.label = (address.label || 'Home').trim();
    if (withDefault) payload.isDefault = Boolean(address.isDefault);

    setSaving(true);
    setServerError('');
    try {
      await onSubmit(payload);
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setServerError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="address-form" noValidate>
      <InlineAlert>{serverError}</InlineAlert>
      <div className="form-grid">
        {withLabel && <FormField label="Label (e.g. Home, Office)" name="label" value={address.label} onChange={onChange} maxLength={40} />}
        {ADDRESS_FIELDS.map((field) => (
          <FormField
            key={field.name}
            className={field.wide ? 'form-grid__wide' : ''}
            label={field.label}
            name={field.name}
            type={field.type || 'text'}
            autoComplete={field.autoComplete}
            value={address[field.name]}
            onChange={onChange}
            error={errors[field.name]}
            required
          />
        ))}
      </div>
      {withDefault && (
        <label className="check">
          <input type="checkbox" name="isDefault" checked={Boolean(address.isDefault)} onChange={onChange} />
          <span>Use as my default address</span>
        </label>
      )}
      {children}
      <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
