// Small helpers that turn a ride into text. Shared by the card, detail page and lists.
import { DAYS } from '../../lib/constants.js';
import { formatRelative, formatTime } from '../../lib/format.js';

export function daysText(days = []) {
  if (days.length === 0) return '';
  if (days.length === 7) return 'Every day';
  return days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b).map((i) => DAYS[i]).join(', ');
}

export function whenText(ride) {
  if (ride.frequency === 'recurring') return `${daysText(ride.days)} · ${formatTime(ride.time)}`;
  return `${formatRelative(ride.departAt)}, ${formatTime(ride.departAt)}`;
}

export const seatText = (ride) =>
  ride.kind === 'offer'
    ? `${ride.seats} seat${ride.seats === 1 ? '' : 's'} left`
    : `Needs ${ride.seats} seat${ride.seats === 1 ? '' : 's'}`;
