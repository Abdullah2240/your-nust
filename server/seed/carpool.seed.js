// Sample rides for development. Times are relative to "now" so the seed never goes stale.
import { Ride } from '../src/modules/carpool/ride.model.js';

const at = (days, hour, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export default async function seed({ users }) {
  const a = users.ayesha._id;
  const b = users.bilal._id;
  const rides = [
    { kind: 'offer', frequency: 'recurring', origin: 'G-11', destination: 'H-12, Gate 1', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '08:00', seats: 2, notes: 'Leaving from G-11 Markaz. Small hatchback, no luggage space.', owner: a },
    { kind: 'offer', frequency: 'one-time', origin: 'Bahria Phase 7', destination: 'H-12', departAt: at(1, 7, 45), seats: 1, notes: 'Quiet ride, I leave on time.', owner: b },
    { kind: 'offer', frequency: 'one-time', origin: 'H-12', destination: 'F-10 Markaz', departAt: at(0, 23, 30), seats: 3, notes: 'Evening trip after the lab.', owner: a },
    { kind: 'offer', frequency: 'recurring', origin: 'DHA II', destination: 'H-12', days: ['Mon', 'Wed'], time: '08:30', seats: 0, status: 'Full', owner: b },
    { kind: 'request', frequency: 'one-time', origin: 'I-8', destination: 'H-12', departAt: at(1, 8, 15), seats: 1, notes: 'Have an 9 AM class.', owner: b },
    { kind: 'request', frequency: 'one-time', origin: 'H-12', destination: 'Saddar', departAt: at(3, 14, 0), seats: 2, owner: a },
    { kind: 'offer', frequency: 'recurring', origin: 'Chak Shahzad', destination: 'H-12', days: ['Tue', 'Thu'], time: '07:50', seats: 3, notes: 'Waiting for admin approval.', owner: a, approval: 'pending' },
  ];
  const created = await Ride.create(rides.map((r) => ({ approval: 'approved', status: 'Active', ...r })));
  return created.length;
}
