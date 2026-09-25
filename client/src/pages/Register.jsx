import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/common/FormField';
import { InlineAlert } from '../components/common/States';
import { safeRedirect } from '../components/routing/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fieldErrorsFrom, isEmail, passwordProblem } from '../utils/validators';

export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    const pw = passwordProblem(form.password);
    if (pw) next.password = pw;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError('');
    try {
      const user = await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success(`Welcome to ORiXA, ${user.name.split(' ')[0]}`);
      navigate(redirect, { replace: true });
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <div className="auth__card">
        <p className="eyebrow">Join ORiXA</p>
        <h1>Create account</h1>
        <InlineAlert>{serverError}</InlineAlert>
        <form onSubmit={submit} noValidate>
          <FormField label="Full name" name="name" autoComplete="name" value={form.name} onChange={onChange} error={errors.name} required />
          <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} required />
          <FormField label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} hint="At least 8 characters with a letter and a number" required />
          <FormField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} required />
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth__legal">
          By creating an account you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
        <p className="auth__switch">
          Already have an account? <Link to={`/login${params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
