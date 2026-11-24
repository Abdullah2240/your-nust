import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { Button, Field, Input } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError({ fields: { confirm: "Passwords don't match" } });
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { token: params.get('token') || '', password });
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const f = error?.fields || {};
  return (
    <AuthShell>
      <h1 style={{ marginBottom: 12 }}>Choose a new password</h1>
      {done ? (
        <>
          <p className="muted">Your password has been changed.</p>
          <div className="actions" style={{ marginTop: 20 }}>
            <Button variant="primary" as={Link} to="/signin">Sign in</Button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          {f.token && <p className="form-error" role="alert">{f.token} <Link to="/forgot-password">Request a new link</Link></p>}
          <Field label="New password" error={f.password} hint="At least 8 characters">
            {(id) => <Input id={id} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!f.password} />}
          </Field>
          <Field label="Confirm new password" error={f.confirm}>
            {(id) => <Input id={id} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={!!f.confirm} />}
          </Field>
          <Button variant="primary" type="submit" block disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button>
        </form>
      )}
    </AuthShell>
  );
}
