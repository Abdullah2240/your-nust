import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button, Field, Input, Segmented } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

// Only allow redirects inside our own site.
export const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

export default function SignIn() {
  const { signIn, isSignedIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get('next'));

  if (isSignedIn && !busy) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(form.email, form.password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell>
      <div style={{ marginBottom: 28 }}>
        <Segmented
          label="Account"
          value="in"
          onChange={(v) => v === 'up' && navigate(`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`)}
          options={[{ value: 'in', label: 'Sign in' }, { value: 'up', label: 'Create account' }]}
        />
      </div>
      <form onSubmit={submit} noValidate>
        {error && !error.fields?.email && !error.fields?.password && <p className="form-error" role="alert">{error.message}</p>}
        <Field label="NUST email" error={error?.fields?.email}>
          {(id) => <Input id={id} type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="name@seecs.edu.pk" invalid={!!error?.fields?.email} />}
        </Field>
        <Field label="Password" error={error?.fields?.password}>
          {(id) => <Input id={id} type="password" autoComplete="current-password" required value={form.password} onChange={set('password')} placeholder="At least 8 characters" invalid={!!error?.fields?.password} />}
        </Field>
        <Button variant="primary" type="submit" block disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <p style={{ marginTop: 16 }}>
          <Link className="textlink" to="/forgot-password">Forgot password?</Link>
        </p>
      </form>
    </AuthShell>
  );
}
