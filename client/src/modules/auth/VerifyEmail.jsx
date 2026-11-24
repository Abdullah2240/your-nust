import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button, Field, Input, Spinner } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { setUser } = useAuth();
  const [state, setState] = useState('working');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its code.');
      return;
    }
    api
      .post('/auth/verify', { token })
      .then((d) => { setUser(d.user); setState('done'); })
      .catch((err) => { setState('error'); setMessage(err.message); });
  }, [params, setUser]);

  const resend = async (e) => {
    e.preventDefault();
    await api.post('/auth/resend-verification', { email }).catch(() => {});
    setResent(true);
  };

  return (
    <AuthShell>
      {state === 'working' && <Spinner label="Verifying your email" />}
      {state === 'done' && (
        <div>
          <p className="eyebrow">All set</p>
          <h1 style={{ margin: '8px 0 12px' }}>Email verified</h1>
          <p className="muted">You're signed in and can now post, request and report.</p>
          <div className="actions" style={{ marginTop: 20 }}>
            <Button variant="primary" as={Link} to="/">Go to Your NUST</Button>
          </div>
        </div>
      )}
      {state === 'error' && (
        <form onSubmit={resend}>
          <h1 style={{ marginBottom: 12 }}>Link didn't work</h1>
          <p className="form-error" role="alert">{message}</p>
          {resent ? (
            <p className="muted">If that email has an unverified account, a new link is on its way.</p>
          ) : (
            <>
              <Field label="Your NUST email">
                {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@seecs.edu.pk" />}
              </Field>
              <Button variant="primary" type="submit" block>Send a new link</Button>
            </>
          )}
        </form>
      )}
    </AuthShell>
  );
}
