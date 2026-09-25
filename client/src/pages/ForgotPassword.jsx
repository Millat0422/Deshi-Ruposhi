import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../components/common/FormField';
import { InlineAlert } from '../components/common/States';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';
import { isEmail } from '../utils/validators';

export default function ForgotPassword() {
  useDocumentTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setServerError('');
    setLoading(true);
    try {
      const { message } = await authService.forgotPassword(email.trim());
      setSentMessage(message);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <div className="auth__card">
        {sentMessage ? (
          <div className="auth__done">
            <MailCheck size={40} strokeWidth={1.25} aria-hidden="true" />
            <h1>Check your inbox</h1>
            <p className="muted">{sentMessage} The link expires in 30 minutes.</p>
            <Link to="/login" className="btn btn--outline btn--block">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <p className="eyebrow">Account help</p>
            <h1>Forgot password</h1>
            <p className="muted">Enter your email and we will send you a link to reset your password.</p>
            <InlineAlert>{serverError}</InlineAlert>
            <form onSubmit={submit} noValidate>
              <FormField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required />
              <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="auth__switch">
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
