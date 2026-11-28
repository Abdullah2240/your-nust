import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import Icon from '../../components/Icon.jsx';
import ReportButton from '../../components/ReportButton.jsx';
import { Button, Chip, EmptyState, ErrorState, Field, Input, Select, Spinner, StatusDot } from '../../components/ui.jsx';
import { useApi } from '../requests/useApi.js';
import '../requests/requests.css';
import '../projects/projects.css';
import RideRequestDialog from './RideRequestDialog.jsx';
import SafetyNotice from './SafetyNotice.jsx';
import { seatText, whenText } from './rideText.js';
import './carpool.css';

export default function RideDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [seats, setSeats] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data: r, error, loading, reload } = useApi(() => api.get(`/carpool/${id}`), [id]);

  const save = async () => {
    setBusy(true);
    try {
      const body = {};
      if (status !== null && status !== r.status) body.status = status;
      if (seats !== null && Number(seats) !== r.seats) body.seats = Number(seats);
      if (Object.keys(body).length === 0) return toast('Nothing to save.');
      await api.patch(`/carpool/${id}`, body);
      toast('Ride updated.');
      setStatus(null);
      setSeats(null);
      reload();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !r) return <div className="wrap body"><Spinner /></div>;
  if (error?.status === 404) {
    return (
      <div className="wrap body">
        <EmptyState title="This ride is not available.">
          <Button as={Link} to="/carpool" variant="tertiary">Back to carpool</Button>
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="wrap body"><ErrorState error={error} onRetry={reload} /></div>;

  const mine = user && r.owner?.id === user.id;

  return (
    <div className="wrap body">
      <Link to="/carpool" className="textlink"><Icon name="back" /> All rides</Link>
      <div style={{ marginTop: 20 }}><SafetyNotice /></div>

      {r.approval === 'pending' && (
        <div className="notice"><Icon name="info" /><span>This recurring ride is waiting for admin approval. Only you and the admins can see it.</span></div>
      )}
      {r.approval === 'rejected' && <div className="rejection" style={{ marginBottom: 20 }}><strong>Not approved.</strong> {r.rejectionReason}</div>}
      {r.isRemoved && <div className="rejection" style={{ marginBottom: 20 }}>This ride was removed by a moderator and is hidden from everyone else.</div>}

      <div className="stack ride" style={{ maxWidth: 720 }}>
        <div className="row between">
          <h1 className="route">{r.origin}<Icon name="arrow" />{r.destination}</h1>
          <StatusDot status={r.status} />
        </div>
        <Chip>{r.kind === 'offer' ? 'Ride offered' : 'Ride needed'}</Chip>
        <div className="ride-facts">
          <span><Icon name="clock" />{whenText(r)}</span>
          <span><Icon name="seat" />{seatText(r)}</span>
          <span><Icon name="repeat" />{r.frequency === 'recurring' ? 'Recurring' : 'One-time'}</span>
        </div>
        {r.notes && <p style={{ whiteSpace: 'pre-wrap', fontSize: 16, lineHeight: '26px' }}>{r.notes}</p>}
        <dl className="kv">
          <dt>Posted by</dt>
          <dd className="owner-box">
            <strong>{r.owner.name}</strong>
            <span className="meta">{r.owner.department}{r.owner.batch ? ` · batch ${r.owner.batch}` : ''}</span>
          </dd>
        </dl>
        <p className="meta">Contact details are shared only after the poster accepts your request.</p>
        {mine && r.approval === 'approved' && !['Completed', 'Cancelled'].includes(r.status) && (
          <div className="grid2">
            <Field label="Status">
              {(fid) => <Select id={fid} value={status ?? r.status} onChange={(e) => setStatus(e.target.value)} options={['Active', 'Full', 'Completed', 'Cancelled']} />}
            </Field>
            <Field label={r.kind === 'offer' ? 'Seats offered (left)' : 'Seats needed'}>
              {(fid) => <Input id={fid} type="number" min="0" max="8" value={seats ?? r.seats} onChange={(e) => setSeats(e.target.value)} />}
            </Field>
            <div><Button variant="secondary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</Button></div>
          </div>
        )}
        <div className="actions">
          {mine ? (
            <>
              <Button as={Link} to={`/carpool/${r.id}/edit`} variant="tertiary">Edit notes</Button>
              <Button as={Link} to="/me/requests?tab=incoming" variant="tertiary">See requests</Button>
            </>
          ) : (
            <>
              {r.status === 'Active' && r.approval === 'approved' ? (
                <Button variant="primary" onClick={() => setOpen(true)}>{r.kind === 'offer' ? 'Request a seat' : 'Offer this ride'}</Button>
              ) : (
                <span className="meta">This ride is not taking requests right now.</span>
              )}
              {r.approval === 'approved' && <ReportButton targetType="carpool" targetId={r.id} />}
            </>
          )}
        </div>
      </div>
      {open && <RideRequestDialog ride={r} onClose={() => setOpen(false)} onSent={reload} />}
    </div>
  );
}
