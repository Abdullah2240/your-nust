// Admin approval list used by ProjectApprovals and RideApprovals.
// endpoint: '/projects' or '/carpool'. renderBody(item) draws the details of one post.
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { formatRelative } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, Card, EmptyState, ErrorState, Field, Spinner, Textarea } from '../../components/ui.jsx';
import { useApi } from './useApi.js';
import './requests.css';

export default function ApprovalQueue({ title, endpoint, emptyText, renderBody }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error: loadError, loading, reload } = useApi(() => api.get(`${endpoint}/admin/pending`, { page }), [endpoint, page]);

  const decide = async (item, decision, why) => {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`${endpoint}/${item.id}/approval`, { decision, reason: why });
      toast(decision === 'approved' ? 'Approved. The owner has been notified.' : 'Rejected. The owner has been notified.');
      setRejecting(null);
      setReason('');
      reload();
    } catch (err) {
      setError(err);
      if (!rejecting) toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{title}</h2>
      {loadError && <ErrorState error={loadError} onRetry={reload} />}
      {!loadError && loading && !data && <Spinner />}
      {data && data.items.length === 0 && <EmptyState title={emptyText} />}
      {data && data.items.length > 0 && (
        <div className="stack">
          {data.items.map((item) => (
            <Card key={item.id} className="pcard">
              {renderBody(item)}
              <div className="card-foot">
                <span className="meta">
                  Posted by {item.owner?.name} ({item.owner?.department}) · <span className="mono">{formatRelative(item.createdAt)}</span>
                </span>
                <div className="actions">
                  <Button variant="tertiary" disabled={busy} onClick={() => { setRejecting(item); setError(null); }}>Reject</Button>
                  <Button variant="secondary" disabled={busy} onClick={() => decide(item, 'approved')}>Approve</Button>
                </div>
              </div>
            </Card>
          ))}
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </div>
      )}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Why is this not approved?"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={() => decide(rejecting, 'rejected', reason)}>Send rejection</Button>
          </>
        }
      >
        <p className="muted">The owner sees this message and can edit the post and send it again.</p>
        <div style={{ marginTop: 14 }}>
          <Field label="Reason" error={error?.fields?.reason}>
            {(id) => <Textarea id={id} rows={3} maxLength={300} invalid={!!error?.fields?.reason} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: please add more detail about what you need help with." />}
          </Field>
        </div>
      </Modal>
    </div>
  );
}
