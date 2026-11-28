// Small helpers that turn a ride into text. Shared by the card, detail page and lists.
import { DAYS } from '../../lib/constants.js';
import { formatRelative, formatTime } from '../../lib/format.js';

export function daysText(days = []) {
  if (days.length === 0) return '';
  if (days.length === 7) return 'Every day';
  const idx = days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b);
  const consecutive = idx.length > 2 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (consecutive) return `${DAYS[idx[0]]} to ${DAYS[idx[idx.length - 1]]}`;
  return idx.map((i) => DAYS[i]).join(', ');
}

export function whenText(ride) {
  if (ride.frequency === 'recurring') return `${daysText(ride.days)}, ${formatTime(ride.time)}`;
  return `${formatRelative(ride.departAt)}, ${formatTime(ride.departAt)}`;
}

export const seatText = (ride) =>
  `${ride.seats} seat${ride.seats === 1 ? '' : 's'} ${ride.kind === 'offer' ? 'free' : 'needed'}`;
