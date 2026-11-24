import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api.js';
import { REPORT_REASONS } from '../../lib/constants.js';
import { formatRelative } from '../../lib/format.js';
import { Button, Card, Chip, EmptyState, ErrorState, Segmented, Spinner, StatusDot } from '../../components/ui.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useToast } from '../../components/Toast.jsx';

const REASON_LABEL = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));
const TYPE_LABEL = { lostfound: 'Lost & Found', project: 'Project', carpool: 'Ride' };
const STATUS_VIEW = { open: 'pending', actioned: 'Completed', dismissed: 'withdrawn' };
const STATUS_TEXT = { open: 'Open', actioned: 'Post removed', dismissed: 'Dismissed' };

export default function ReportsTab() {
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    setError(null);
    api.get('/admin/reports', { status, page }).then(setData).catch(setError);
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (report, action) => {
    setBusy(true);
    try {
      await api.patch(`/admin/reports/${report.id}`, { action });
      toast(action === 'remove' ? 'Post removed and the owner notified.' : 'Report dismissed.');
      setConfirm(null);
      load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="row between" style={{ marginBottom: 20 }}>
        <h2>Reports</h2>
        <Segmented
          label="Report status"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[{ value: 'open', label: 'Open' }, { value: 'actioned', label: 'Removed' }, { value: 'dismissed', label: 'Dismissed' }]}
        />
      </div>
      {error && <ErrorState error={error} onRetry={load} />}
      {!error && !data && <Spinner />}
      {data && data.items.length === 0 && (
        <EmptyState title={status === 'open' ? 'No reports waiting. All clear.' : 'Nothing here yet.'} />
      )}
      {data && data.items.length > 0 && (
        <div className="stack">
          {data.items.map((r) => (
            <Card key={r.id} className="pcard">
              <div className="row between">
                <div className="row">
                  <Chip>{TYPE_LABEL[r.targetType] ?? 'Post'}</Chip>
                  <strong>{REASON_LABEL[r.reason] ?? r.reason}</strong>
                </div>
                <StatusDot status={STATUS_VIEW[r.status]} label={STATUS_TEXT[r.status]} />
              </div>
              {r.target ? (
                <p>
                  <Link to={r.target.link}>{r.target.title || 'Untitled post'}</Link>
                  {r.target.isRemoved && <span className="meta"> · already removed</span>}
                </p>
              ) : (
                <p className="muted">This post no longer exists.</p>
              )}
              {r.details && <p className="meta" style={{ fontSize: 15, lineHeight: '24px' }}>“{r.details}”</p>}
              <div className="card-foot">
                <span className="meta">
                  Reported by {r.reporter?.name ?? 'a member'} ({r.reporter?.department}) · <span className="mono">{formatRelative(r.createdAt)}</span>
                </span>
                {r.status === 'open' && (
                  <div className="actions">
                    <Button variant="tertiary" disabled={busy} onClick={() => decide(r, 'dismiss')}>Dismiss</Button>
                    {r.target && !r.target.isRemoved && (
                      <Button variant="secondary" disabled={busy} onClick={() => setConfirm(r)}>Remove post</Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </div>
      )}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Remove this post?"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={() => decide(confirm, 'remove')}>Remove post</Button>
          </>
        }
      >
        <p className="muted">
          “{confirm?.target?.title}” will disappear from every list and search. The owner gets a notification, and every open
          report on this post is closed.
        </p>
      </Modal>
    </div>
  );
}
