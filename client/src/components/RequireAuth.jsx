// Route guard. <RequireAuth verified>…</RequireAuth> or <RequireAuth admin>…</RequireAuth>
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button, EmptyState, Spinner } from './ui.jsx';

export default function RequireAuth({ verified, admin, children }) {
  const { loading, isSignedIn, isVerified, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="wrap body"><Spinner /></div>;
  if (!isSignedIn) {
    return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (admin && !isAdmin) {
    return (
      <div className="wrap body">
        <EmptyState title="This page is for administrators only.">
          <Button as={Link} to="/" variant="tertiary">Go home</Button>
        </EmptyState>
      </div>
    );
  }
  if (verified && !isVerified) {
    return (
      <div className="wrap body">
        <EmptyState title="Verify your NUST email to use this page.">
          <p className="meta">We sent a link to your inbox. Use the banner above to resend it.</p>
        </EmptyState>
      </div>
    );
  }
  return children;
}
