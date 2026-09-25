// Client-side validation (the server validates again — never rely on the client alone).
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

export const passwordProblem = (value) => {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must include a letter and a number';
  return '';
};

export const ADDRESS_FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel', type: 'tel' },
  { name: 'address', label: 'Address', autoComplete: 'street-address', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State / Division', autoComplete: 'address-level1' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
];

export const EMPTY_ADDRESS = { fullName: '', phone: '', address: '', city: '', state: '', postalCode: '', country: 'Bangladesh' };

export const validateAddress = (address) => {
  const errors = {};
  ADDRESS_FIELDS.forEach(({ name, label }) => {
    if (!String(address[name] || '').trim()) errors[name] = `${label} is required`;
  });
  if (address.phone && !/^[+()\d\s-]{6,30}$/.test(address.phone)) errors.phone = 'Enter a valid phone number';
  if (address.postalCode && !/^[A-Za-z0-9\s-]{3,12}$/.test(address.postalCode)) errors.postalCode = 'Enter a valid postal code';
  return errors;
};

// Turn server field errors [{ field, message }] into { field: message }
export const fieldErrorsFrom = (error) =>
  Object.fromEntries((error?.errors || []).map(({ field, message }) => [String(field).replace(/^shippingAddress\./, ''), message]));
