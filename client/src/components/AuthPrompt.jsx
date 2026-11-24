// The "Sign in to …" / "Verify your email first" dialog used by useAuthGate().
import { createContext, useCallback, useContext, useState } from 'react';
import { Link, useLocation } from 'react-router';
import Modal from './Modal.jsx';
import { Button } from './ui.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useToast } from './Toast.jsx';

const PromptContext = createContext(() => {});

export function AuthPromptProvider({ children }) {
  const [state, setState] = useState(null);
  const prompt = useCallback((s) => setState(s), []);
  const close = () => setState(null);
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const next = encodeURIComponent(location.pathname + location.search);

  const resend = async () => {
    await api.post('/auth/resend-verification', { email: user?.email }).catch(() => {});
    toast('Verification email sent. Check your inbox.');
    close();
  };

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <Modal
        open={state?.kind === 'signin'}
        onClose={close}
        title={`Sign in to ${state?.action ?? 'continue'}`}
        footer={
          <>
            <Button variant="tertiary" onClick={close}>Not now</Button>
            <Button variant="primary" as={Link} to={`/signin?next=${next}`} onClick={close}>Sign in</Button>
          </>
        }
      >
        <p className="muted">Posting and requests are for verified NUST members, so every post can be traced to a real student.</p>
      </Modal>
      <Modal
        open={state?.kind === 'verify'}
        onClose={close}
        title="Verify your email first"
        footer={
          <>
            <Button variant="tertiary" onClick={close}>Not now</Button>
            <Button variant="primary" onClick={resend}>Resend email</Button>
          </>
        }
      >
        <p className="muted">To {state?.action ?? 'do that'}, confirm your NUST email using the link we sent to {user?.email}.</p>
      </Modal>
    </PromptContext.Provider>
  );
}

export function useAuthPrompt() {
  return useContext(PromptContext);
}
