// const gate = useAuthGate(); gate('post a listing', () => navigate('/lost-found/new'))
// Guests see "Sign in to …", unverified users see "Verify your email first", verified members run the callback.
import { useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useAuthPrompt } from '../components/AuthPrompt.jsx';

export function useAuthGate() {
  const { isSignedIn, isVerified } = useAuth();
  const prompt = useAuthPrompt();
  return useCallback(
    (action, callback) => {
      if (!isSignedIn) return prompt({ kind: 'signin', action });
      if (!isVerified) return prompt({ kind: 'verify', action });
      return callback?.();
    },
    [isSignedIn, isVerified, prompt],
  );
}
