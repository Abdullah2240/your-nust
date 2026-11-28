import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext.jsx';
import Icon from '../../components/Icon.jsx';
import { Button, Card, Chip, StatusDot } from '../../components/ui.jsx';
import { seatText, whenText } from './rideText.js';
import './carpool.css';

export default function RideCard({ ride, onRequest }) {
  const { user } = useAuth();
  const mine = user && ride.owner?.id === user.id;
  return (
    <Card as="article" className="pcard ride">
      <div className="row between">
        <Link className="route" to={`/carpool/${ride.id}`}>
          {ride.origin}<Icon name="arrow" />{ride.destination}
        </Link>
        <StatusDot status={ride.status} />
      </div>
      <div className="ride-facts">
        <span className="mono"><Icon name="clock" />{whenText(ride)}</span>
        <span className="mono"><Icon name="seat" />{seatText(ride)}</span>
        <Chip>{ride.frequency === 'recurring' ? 'Recurring' : 'One-time'}</Chip>
      </div>
      <p className="meta">{ride.owner?.name}, {ride.owner?.department}</p>
      <div className="card-foot">
        <span className="meta">Contact shared after approval</span>
        {mine ? (
          <Button as={Link} to={`/carpool/${ride.id}`} variant="tertiary">Your ride</Button>
        ) : (
          ride.status === 'Active' && (
            <Button variant="secondary" onClick={() => onRequest(ride)}>
              {ride.kind === 'offer' ? 'Request a seat' : 'Offer this ride'}
            </Button>
          )
        )}
      </div>
    </Card>
  );
}
