// Shows the other person's contact details for an ACCEPTED request, with copy buttons.
import { api } from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';
import { Button, Spinner } from '../../components/ui.jsx';
import { useApi } from './useApi.js';
import './requests.css';

function Line({ label, value }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied`);
    } catch {
      toast('Could not copy. Select the text and copy it by hand.');
    }
  };
  return (
    <div className="row">
      <span>{label}: <span className="mono">{value}</span></span>
      <Button variant="tertiary" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>Copy</Button>
    </div>
  );
}

export default function ContactReveal({ requestId }) {
  const { data, error, loading } = useApi(() => api.get(`/requests/${requestId}/contact`), [requestId]);
  if (loading) return <Spinner />;
  if (error) return <p className="form-error" role="alert">{error.message}</p>;
  const c = data.contact;
  return (
    <div className="contact-box">
      <strong>{c.name}</strong>
      {c.email && <Line label="Email" value={c.email} />}
      {c.phone && <Line label="Phone" value={c.phone} />}
      <p className="note-line">Only you two can see this. Please use it only for this arrangement.</p>
    </div>
  );
}
