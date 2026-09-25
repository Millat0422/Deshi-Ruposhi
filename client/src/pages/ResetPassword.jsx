import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormField from '../components/common/FormField';
import { InlineAlert } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';
import { passwordProblem } from '../utils/validators';

export default function ResetPassword() {
  useDocumentTitle('Reset password');
  const { token } = useParams();
  const { saveSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    const pw = passwordProblem(form.password);
    if (pw) next.password = pw;
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError('');
    try {
      saveSession(await authService.resetPassword(token, form.password));
      toast.success('Your password has been reset');
      navigate('/profile', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth container">
      <div className="auth__card">
        <p className="eyebrow">Account help</p>
        <h1>Choose a new password</h1>
        <InlineAlert>{serverError}</InlineAlert>
        <form onSubmit={submit} noValidate>
          <FormField label="New password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} error={errors.password} hint="At least 8 characters with a letter and a number" />
          <FormField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
            {loading ? 'Saving…' : 'Reset password'}
          </button>
        </form>
        <p className="auth__switch">
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </div>
    </div>
  );
}
