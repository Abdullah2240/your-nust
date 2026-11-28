import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, Card, Chip, EmptyState, ErrorState, PageHead, Segmented, Select, Spinner, StatusDot } from '../../components/ui.jsx';
import ContactReveal from './ContactReveal.jsx';
import { useApi } from './useApi.js';
import './requests.css';

const TYPE_LABEL = { lostfound: 'Lost & Found', project: 'Project', carpool: 'Ride' };
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];
const STATUS_TEXT = { pending: 'Pending', approved: 'Accepted', declined: 'Declined', withdrawn: 'Withdrawn' };

function Person({ p }) {
  if (!p) return null;
  return (
    <div className="person">
      <strong>{p.name}</strong>
      <span className="meta">{p.department}{p.batch ? ` · batch ${p.batch}` : ''}</span>
      {p.skills?.slice(0, 6).map((s) => <Chip key={s}>{s}</Chip>)}
    </div>
  );
}

function RequestRow({ item, side, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const other = side === 'incoming' ? item.requester : item.owner;

  const act = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      toast(success);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
      setConfirming(false);
      onChanged();
    }
  };

  return (
    <Card className="pcard">
      <div className="row between">
        <div className="row">
          <Chip>{TYPE_LABEL[item.targetType] ?? 'Post'}</Chip>
          {item.target.link ? <Link className="link-title" to={item.target.link}>{item.target.title}</Link> : <span className="link-title">{item.target.title}</span>}
        </div>
        <StatusDot status={item.status} label={STATUS_TEXT[item.status]} />
      </div>
      <div className="meta">{side === 'incoming' ? 'From' : 'To'}: <Person p={other} /></div>
      {item.message && <p className="msg">{item.message}</p>}
      {item.targetType === 'carpool' && <p className="meta"><span className="mono">{item.seats}</span> seat{item.seats === 1 ? '' : 's'}</p>}
      {item.status === 'approved' && showContact && <ContactReveal requestId={item.id} />}
      <div className="card-foot">
        <span className="meta mono">{formatDate(item.createdAt)}</span>
        <div className="actions">
          {item.status === 'approved' && !showContact && <Button variant="secondary" onClick={() => setShowContact(true)}>Show contact</Button>}
          {item.status === 'pending' && side === 'incoming' && (
            <>
              <Button variant="tertiary" disabled={busy} onClick={() => act(() => api.patch(`/requests/${item.id}`, { decision: 'declined' }), 'Request declined.')}>Decline</Button>
              <Button variant="secondary" disabled={busy} onClick={() => setConfirming(true)}>Accept</Button>
            </>
          )}
          {item.status === 'pending' && side === 'sent' && (
            <Button variant="tertiary" disabled={busy} onClick={() => act(() => api.patch(`/requests/${item.id}/withdraw`), 'Request withdrawn.')}>Withdraw</Button>
          )}
        </div>
      </div>
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Accept ${item.requester?.name ?? 'this person'}?`}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={() => act(() => api.patch(`/requests/${item.id}`, { decision: 'approved' }), 'Accepted. You can now see their contact details.')}>Accept</Button>
          </>
        }
      >
        <p className="muted">Your contact details will be shared with them, and theirs with you.</p>
      </Modal>
    </Card>
  );
}

export default function MyRequests() {
  const [params, setParams] = useSearchParams();
  const side = params.get('tab') === 'sent' ? 'sent' : 'incoming';
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const path = side === 'incoming' ? '/requests/incoming' : '/requests/outgoing';
  const { data, error, loading, reload } = useApi(() => api.get(path, { status, page }), [path, status, page]);

  return (
    <>
      <PageHead title="My requests" subtitle="Requests on your posts, and requests you sent." />
      <div className="wrap body">
        <div className="req-tabs">
          <Segmented
            label="Which requests"
            value={side}
            onChange={(v) => { setParams({ tab: v }); setPage(1); }}
            options={[{ value: 'incoming', label: 'Incoming' }, { value: 'sent', label: 'Sent' }]}
          />
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
        <p className="meta" style={{ marginBottom: 16 }}>{side === 'incoming' ? 'Requests on my posts' : 'My requests'}</p>
        {error && <ErrorState error={error} onRetry={reload} />}
        {!error && loading && !data && <Spinner />}
        {data && data.items.length === 0 && (
          <EmptyState title={side === 'incoming' ? 'No one has requested your posts yet.' : "You haven't sent any requests yet."}>
            {side === 'sent' && (
              <div className="row" style={{ justifyContent: 'center' }}>
                <Button as={Link} to="/projects" variant="tertiary">Browse projects</Button>
                <Button as={Link} to="/carpool" variant="tertiary">Browse rides</Button>
              </div>
            )}
          </EmptyState>
        )}
        {data && data.items.length > 0 && (
          <div className="stack">
            {data.items.map((item) => <RequestRow key={item.id} item={item} side={side} onChanged={reload} />)}
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}
