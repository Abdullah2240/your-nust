import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { formatRelative } from '../../lib/format.js';
import Pagination from '../../components/Pagination.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, Card, Chip, EmptyState, ErrorState, PageHead, Segmented, Select, Spinner, StatusDot } from '../../components/ui.jsx';
import { useApi } from './useApi.js';
import './requests.css';

const TYPE_LABEL = { lostfound: 'Lost & Found', project: 'Project', carpool: 'Ride' };
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' },
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

function ContactBox({ requestId }) {
  const { data, error, loading } = useApi(() => api.get(`/requests/${requestId}/contact`), [requestId]);
  if (loading) return <Spinner />;
  if (error) return <p className="form-error" role="alert">{error.message}</p>;
  const c = data.contact;
  return (
    <div className="contact-box">
      <strong>{c.name}</strong>
      {c.email && <div>Email: <a href={`mailto:${c.email}`}>{c.email}</a></div>}
      {c.phone && <div>Phone: <span className="mono">{c.phone}</span></div>}
      <p className="note-line">Only you two can see this. Please use it only for this arrangement.</p>
    </div>
  );
}

function RequestCard({ item, side, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const other = side === 'received' ? item.requester : item.owner;

  const act = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      toast(success);
      onChanged();
    } catch (err) {
      toast(err.message);
      onChanged();
    } finally {
      setBusy(false);
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
      <div className="meta">
        {side === 'received' ? 'From' : 'To'}: <Person p={other} />
      </div>
      {item.message && <p className="msg">{item.message}</p>}
      {item.targetType === 'carpool' && (
        <p className="meta"><span className="mono">{item.seats}</span> seat{item.seats === 1 ? '' : 's'}</p>
      )}
      {item.status === 'approved' && showContact && <ContactBox requestId={item.id} />}
      <div className="card-foot">
        <span className="meta mono">{formatRelative(item.createdAt)}</span>
        <div className="actions">
          {item.status === 'approved' && !showContact && (
            <Button variant="secondary" onClick={() => setShowContact(true)}>Show contact details</Button>
          )}
          {item.status === 'pending' && side === 'received' && (
            <>
              <Button variant="tertiary" disabled={busy} onClick={() => act(() => api.patch(`/requests/${item.id}`, { decision: 'declined' }), 'Request declined.')}>Decline</Button>
              <Button variant="secondary" disabled={busy} onClick={() => act(() => api.patch(`/requests/${item.id}`, { decision: 'approved' }), 'Accepted. You can now see their contact details.')}>Accept</Button>
            </>
          )}
          {item.status === 'pending' && side === 'sent' && (
            <Button variant="tertiary" disabled={busy} onClick={() => act(() => api.patch(`/requests/${item.id}/withdraw`), 'Request withdrawn.')}>Withdraw</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function MyRequests() {
  const [params, setParams] = useSearchParams();
  const side = params.get('tab') === 'sent' ? 'sent' : 'received';
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const path = side === 'received' ? '/requests/incoming' : '/requests/outgoing';
  const { data, error, loading, reload } = useApi(() => api.get(path, { status, page }), [path, status, page]);

  return (
    <>
      <PageHead title="My requests" subtitle="Requests you received for your posts, and requests you sent." />
      <div className="wrap body">
        <div className="req-tabs">
          <Segmented
            label="Which requests"
            value={side}
            onChange={(v) => { setParams({ tab: v }); setPage(1); }}
            options={[{ value: 'received', label: 'Received' }, { value: 'sent', label: 'Sent' }]}
          />
          <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
        {error && <ErrorState error={error} onRetry={reload} />}
        {!error && loading && !data && <Spinner />}
        {data && data.items.length === 0 && (
          <EmptyState title={side === 'received' ? 'No requests for your posts yet.' : "You haven't sent any requests yet."}>
            <p className="meta">
              {side === 'received' ? 'When someone wants to join your project or ride, it shows up here.' : 'Find a project to join or a ride to share.'}
            </p>
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
            {data.items.map((item) => <RequestCard key={item.id} item={item} side={side} onChanged={reload} />)}
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </div>
        )}
      </div>
    </>
  );
}
