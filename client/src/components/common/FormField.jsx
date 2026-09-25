import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';

// Label + input + error message, wired up for screen readers.
export default function FormField({ label, error, hint, type = 'text', as = 'input', className = '', children, ...inputProps }) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const describedBy = [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;
  const common = { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, ...inputProps };

  let control;
  if (as === 'textarea') control = <textarea {...common} />;
  else if (as === 'select') control = <select {...common}>{children}</select>;
  else if (type === 'password') {
    control = (
      <div className="field__password">
        <input {...common} type={showPassword ? 'text' : 'password'} />
        <button type="button" className="field__toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  } else control = <input {...common} type={type} />;

  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {control}
      {hint && !error && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
