import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api.js';
import { Button, Field, Input } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 style={{ marginBottom: 12 }}>Reset your password</h1>
      {sent ? (
        <>
          <p className="muted">If <strong>{email}</strong> has an account, a reset link is on its way. It works for 1 hour.</p>
          <div className="actions" style={{ marginTop: 20 }}>
            <Button variant="tertiary" as={Link} to="/signin">Back to sign in</Button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="muted" style={{ marginBottom: 20 }}>Enter your NUST email and we'll send you a link to choose a new password.</p>
          <Field label="NUST email" error={error?.fields?.email || (error && !error.fields?.email ? error.message : '')}>
            {(id) => <Input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@seecs.edu.pk" invalid={!!error} />}
          </Field>
          <Button variant="primary" type="submit" block disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
          <p style={{ marginTop: 16 }}><Link className="textlink" to="/signin">Back to sign in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
