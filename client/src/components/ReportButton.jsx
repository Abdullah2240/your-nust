// <ReportButton targetType="lostfound" targetId={id} />
// Link-style button: opens a reason dialog and sends POST /api/reports. Guests are asked to sign in.
import { useState } from 'react';
import { useAuthGate } from '../auth/useAuthGate.js';
import { api } from '../lib/api.js';
import { REPORT_REASONS } from '../lib/constants.js';
import { useToast } from './Toast.jsx';
import Modal from './Modal.jsx';
import { Button, Field, Textarea } from './ui.jsx';
import Icon from './Icon.jsx';

export default function ReportButton({ targetType, targetId }) {
  const gate = useAuthGate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return setError({ message: 'Choose a reason.' });
    setBusy(true);
    setError(null);
    try {
      await api.post('/reports', { targetType, targetId, reason, details });
      toast('Thanks. An admin will review this.');
      setReason('');
      setDetails('');
      setOpen(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="textlink report-link" onClick={() => gate('report a post', () => setOpen(true))}>
        <Icon name="flag" /> Report
      </button>
      <Modal open={open} onClose={close} title="Report this post">
        <form onSubmit={submit} noValidate>
          <p className="muted">Reports go to the admins. The poster won't see who reported them.</p>
          <fieldset className="radio-list">
            <legend className="sr-only">Reason</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.value}>
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </fieldset>
          <Field label="Anything else? (optional)" error={error?.fields?.details}>
            {(id) => <Textarea id={id} rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What's wrong with this post?" />}
          </Field>
          {error && !error.fields?.details && <p className="form-error" role="alert">{error.message}</p>}
          <div className="actions">
            <Button variant="tertiary" onClick={close}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
