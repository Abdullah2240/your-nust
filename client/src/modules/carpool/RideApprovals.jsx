import { Link } from 'react-router';
import Icon from '../../components/Icon.jsx';
import { StatusDot } from '../../components/ui.jsx';
import ApprovalQueue from '../requests/ApprovalQueue.jsx';
import { seatText, whenText } from './rideText.js';
import './carpool.css';

export default function RideApprovals() {
  return (
    <ApprovalQueue
      title="Ride approvals"
      endpoint="/carpool"
      emptyText="Nothing waiting for approval."
      renderBody={(r) => (
        <div className="ride">
          <div className="row between">
            <Link className="route" to={`/carpool/${r.id}`}>{r.origin}<Icon name="arrow" />{r.destination}</Link>
            <StatusDot status="pending" />
          </div>
          <div className="ride-facts" style={{ marginTop: 8 }}>
            <span><Icon name="clock" />{whenText(r)}</span>
            <span><Icon name="seat" />{seatText(r)}</span>
            <span><Icon name="repeat" />Recurring</span>
          </div>
          {r.notes && <p className="meta" style={{ marginTop: 8 }}>{r.notes}</p>}
        </div>
      )}
    />
  );
}
