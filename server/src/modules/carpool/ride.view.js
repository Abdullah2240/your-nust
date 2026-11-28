import { toPublicProfile } from '../users/user.utils.js';

export function isRideOwnerOrAdmin(ride, user) {
  if (!user) return false;
  return String(ride.owner?._id ?? ride.owner) === String(user._id) || user.role === 'admin';
}

export function toRideJSON(ride, viewer) {
  const mine = isRideOwnerOrAdmin(ride, viewer);
  const out = {
    id: String(ride._id),
    kind: ride.kind,
    frequency: ride.frequency,
    origin: ride.origin,
    destination: ride.destination,
    departAt: ride.departAt ?? null,
    days: ride.days ?? [],
    time: ride.time ?? '',
    seats: ride.seats,
    notes: ride.notes,
    status: ride.status,
    approval: ride.approval,
    owner: toPublicProfile(ride.owner),
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };
  if (mine) {
    out.rejectionReason = ride.rejectionReason || '';
    out.isRemoved = !!ride.isRemoved;
  }
  return out;
}
