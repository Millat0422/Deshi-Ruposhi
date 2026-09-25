import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { newsletterService } from '../../services/adminService';
import { isEmail } from '../../utils/validators';

// Saves the email to MongoDB via POST /api/newsletter.
export default function NewsletterForm({ variant = 'section' }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputId = `newsletter-${variant}`;

  const submit = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const message = await newsletterService.subscribe(email.trim());
      toast.success(message);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`newsletter-form newsletter-form--${variant}`} onSubmit={submit} noValidate>
      <label htmlFor={inputId} className="visually-hidden">
        Email address
      </label>
      <div className="newsletter-form__row">
        <input id={inputId} type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={Boolean(error)} />
        <button type="submit" className={`btn ${variant === 'section' ? 'btn--primary' : 'btn--light'}`} disabled={loading}>
          {loading ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      {error && (
        <p className="newsletter-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
