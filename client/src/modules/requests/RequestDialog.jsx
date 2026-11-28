// The "send a request" dialog used for projects and rides (and reusable for Lost & Found claims).
import { useState } from 'react';
import { api } from '../../lib/api.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, Field, Select, Textarea } from '../../components/ui.jsx';

export default function RequestDialog({ open, onClose, targetType, targetId, title, intro, placeholder, showSeats, maxSeats, onSent }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [seats, setSeats] = useState('1');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setError(null);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { targetType, targetId, message };
      if (showSeats) body.seats = Number(seats);
      await api.post('/requests', body);
      toast('Request sent');
      setMessage('');
      setSeats('1');
      onClose();
      onSent?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const seatOptions = Array.from({ length: Math.max(maxSeats || 1, 1) }, (_, i) => String(i + 1));

  return (
    <Modal open={open} onClose={close} title={title}>
      <form onSubmit={submit} noValidate>
        <p className="muted">{intro}</p>
        <div style={{ marginTop: 14 }}>
          {showSeats ? (
            <Field label="Seats" error={error?.fields?.seats}>
              {(id) => <Select id={id} value={seats} onChange={(e) => setSeats(e.target.value)} options={seatOptions} />}
            </Field>
          ) : null}
          <Field label="Your message" error={error?.fields?.message} hint="At least 10 characters.">
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                maxLength={500}
                invalid={!!error?.fields?.message}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholder}
              />
            )}
          </Field>
        </div>
        {error && !error.fields?.message && !error.fields?.seats && <p className="form-error" role="alert">{error.message}</p>}
        <div className="actions">
          <Button variant="tertiary" onClick={close}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</Button>
        </div>
      </form>
    </Modal>
  );
}
