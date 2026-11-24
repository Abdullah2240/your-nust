import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Button, Card, ErrorState, Field, Input, Spinner } from '../../components/ui.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

export default function DomainsTab() {
  const toast = useToast();
  const [domains, setDomains] = useState(null);
  const [error, setError] = useState(null);
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api.get('/admin/domains').then(setDomains).catch(setError);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const d = await api.post('/admin/domains', { domain: value });
      toast(`${d.domain} added. People can sign up with it now.`);
      setValue('');
      load();
    } catch (err) {
      setFormError(err.fields?.domain || err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.del(`/admin/domains/${confirm.id}`);
      toast(`${confirm.domain} removed.`);
      setConfirm(null);
      load();
    } catch (err) {
      toast(err.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Email domains</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Only emails on these domains (or their subdomains) can sign up. Adding <span className="mono">nust.edu.pk</span> also allows
        <span className="mono"> name@ceme.nust.edu.pk</span>.
      </p>
      <Card as="form" className="form-card" onSubmit={add} noValidate style={{ marginBottom: 24 }}>
        <Field label="Add a domain" error={formError} hint="For example scme.nust.edu.pk">
          {(id) => <Input id={id} value={value} onChange={(e) => setValue(e.target.value)} placeholder="school.nust.edu.pk" invalid={!!formError} />}
        </Field>
        <Button variant="primary" type="submit" disabled={busy || !value.trim()}>Add domain</Button>
      </Card>
      {error && <ErrorState error={error} onRetry={load} />}
      {!error && !domains && <Spinner />}
      {domains && (
        <table className="table">
          <thead><tr><th>Domain</th><th>Remove</th></tr></thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.domain}</td>
                <td>
                  <Button variant="tertiary" disabled={domains.length <= 1} title={domains.length <= 1 ? 'Keep at least one domain' : undefined} onClick={() => setConfirm(d)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Remove ${confirm?.domain}?`}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={remove}>Remove domain</Button>
          </>
        }
      >
        <p className="muted">New sign-ups from this domain will be refused. Existing accounts are not affected.</p>
      </Modal>
    </div>
  );
}
