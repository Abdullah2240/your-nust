import RequestDialog from '../requests/RequestDialog.jsx';

// Wraps the shared dialog with the ride wording.
export default function RideRequestDialog({ ride, onClose, onSent }) {
  if (!ride) return null;
  const isOffer = ride.kind === 'offer';
  return (
    <RequestDialog
      open
      onClose={onClose}
      onSent={onSent}
      targetType="carpool"
      targetId={ride.id}
      title={isOffer ? 'Request a seat' : 'Offer this ride'}
      intro={`${ride.origin} to ${ride.destination}. The poster sees your basic profile and can accept or decline. Phone numbers stay hidden until then.`}
      placeholder={isOffer ? 'Where exactly will you be waiting?' : 'Where can you pick them up, and when?'}
      maxSeats={isOffer ? ride.seats : undefined}
    />
  );
}
