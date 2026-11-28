import { TARGETS } from '../../lib/targets.js';
import { toPublicProfile } from '../users/user.utils.js';

// Short, safe summary of the post a request is about.
export function targetSummary(type, doc) {
  if (!doc) return { id: null, title: 'This post was deleted', link: '', status: 'Removed' };
  const id = String(doc._id);
  return {
    id,
    title: doc.displayTitle ?? '',
    link: TARGETS[type].path(id),
    status: doc.isRemoved ? 'Removed' : (typeof doc.get === 'function' ? doc.get('status') : doc.status) ?? '',
  };
}

// requester and owner arrive as populated users; only public profiles are ever sent out.
export function toRequestJSON(r, target) {
  return {
    id: String(r._id),
    targetType: r.targetType,
    targetId: String(r.targetId),
    message: r.message,
    seats: r.seats,
    status: r.status,
    decidedAt: r.decidedAt ?? null,
    createdAt: r.createdAt,
    requester: toPublicProfile(r.requester?.name ? r.requester : null),
    owner: toPublicProfile(r.owner?.name ? r.owner : null),
    target: targetSummary(r.targetType, target),
  };
}
