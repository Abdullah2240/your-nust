import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api.js';
import Icon from '../../components/Icon.jsx';
import Pagination from '../../components/Pagination.jsx';
import { Button, Card, EmptyState, ErrorState, Spinner, StatusDot } from '../../components/ui.jsx';
import { useApi } from '../requests/useApi.js';
import '../projects/projects.css';
import { seatText, whenText } from './rideText.js';
import './carpool.css';

export default function MyRides() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(() => api.get('/carpool/mine', { page }), [page]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;
  if (data.items.length === 0) {
    return (
      <EmptyState title="You haven't posted a ride yet.">
        <Button as={Link} to="/carpool/new" variant="tertiary">Offer or ask for a ride</Button>
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      {data.items.map((r) => (
        <Card key={r.id} className="pcard ride">
          <div className="row between">
            <Link className="route" to={`/carpool/${r.id}`}>{r.origin}<Icon name="arrow" />{r.destination}</Link>
            <div className="row">
              {r.isRemoved ? <StatusDot status="rejected" label="Removed by moderator" /> : <StatusDot status={r.approval} label={r.approval === 'approved' ? 'Live' : undefined} />}
              {r.approval === 'approved' && !r.isRemoved && <StatusDot status={r.status} />}
            </div>
          </div>
          {r.approval === 'rejected' && <p className="rejection"><strong>Reason:</strong> {r.rejectionReason}</p>}
          <div className="ride-facts">
            <span><Icon name="clock" />{whenText(r)}</span>
            <span><Icon name="seat" />{seatText(r)}</span>
            <span><Icon name="repeat" />{r.frequency === 'recurring' ? 'Recurring' : 'One-time'}</span>
          </div>
          <div className="card-foot">
            <span className="meta">{r.kind === 'offer' ? 'Ride offered' : 'Ride needed'}</span>
            {!r.isRemoved && r.approval === 'approved' && <Button as={Link} to={`/carpool/${r.id}/edit`} variant="tertiary">Update</Button>}
          </div>
        </Card>
      ))}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  );
}
