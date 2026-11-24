import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui.jsx';

export default function CheckInbox({ email }) {
  const [sent, setSent] = useState(false);
  const resend = async () => {
    await api.post('/auth/resend-verification', { email }).catch(() => {});
    setSent(true);
  };
  return (
    <div>
      <p className="eyebrow">One more step</p>
      <h1 style={{ margin: '8px 0 12px' }}>Check your inbox</h1>
      <p className="muted">
        We sent a verification link to <strong>{email}</strong>. Open it within 24 hours to activate your account.
      </p>
      <div className="panel">Can't find it? Check your spam folder, or send the link again.</div>
      <div className="actions">
        <Button variant="secondary" onClick={resend} disabled={sent}>{sent ? 'Sent again' : 'Resend email'}</Button>
        <Button variant="tertiary" as={Link} to="/signin">Back to sign in</Button>
      </div>
    </div>
  );
}
