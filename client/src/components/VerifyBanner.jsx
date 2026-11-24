import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { api } from '../lib/api.js';

// Shown under the nav while a signed-in user hasn't verified their email.
export default function VerifyBanner() {
  const { user, isSignedIn, isVerified } = useAuth();
  const [sent, setSent] = useState(false);
  if (!isSignedIn || isVerified) return null;

  const resend = async () => {
    await api.post('/auth/resend-verification', { email: user.email }).catch(() => {});
    setSent(true);
  };

  return (
    <div className="verify-banner" role="status">
      <div className="wrap">
        <span>Check your NUST email ({user.email}) to verify your account.</span>
        {sent ? <span className="meta">Sent. Check your inbox.</span> : <button type="button" className="textlink" onClick={resend}>Resend email</button>}
      </div>
    </div>
  );
}
