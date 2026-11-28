import mongoose from 'mongoose';
import { HttpError, ok, paginate } from '../../lib/http.js';
import { getTarget } from '../../lib/targets.js';
import { notify } from '../notifications/notify.js';
import { User } from '../users/user.model.js';
import { toContact } from '../users/user.utils.js';
import { InterestRequest } from './request.model.js';
import { applyApproval, assertAcceptingRequests } from './request.service.js';
import { toRequestJSON } from './request.view.js';

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const isOwnerOf = (post, user) => String(post.owner) === String(user._id);

async function loadRequest(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return InterestRequest.findById(id);
}

// POST /api/requests
export async function createRequest(req, res) {
  const { targetType, targetId, message, seats } = req.body;
  const target = await getTarget(targetType, targetId);
  const approval = target && (typeof target.get === 'function' ? target.get('approval') : target.approval);
  const hidden = !target || (!isOwnerOf(target, req.user) && (target.isRemoved || (approval && approval !== 'approved')));
  if (hidden) throw new HttpError(404, 'NOT_FOUND', 'That post does not exist or is no longer available.');
  if (isOwnerOf(target, req.user)) throw new HttpError(403, 'FORBIDDEN', "You can't send a request to your own post.");

  assertAcceptingRequests(targetType, target);

  let wanted = 1;
  if (targetType === 'carpool') {
    wanted = seats ?? 1;
    if (target.kind === 'offer' && wanted > target.seats) {
      throw new HttpError(409, 'CONFLICT', `Only ${target.seats} seat${target.seats === 1 ? '' : 's'} left on this ride.`);
    }
  }

  let request;
  try {
    request = await InterestRequest.create({
      targetType,
      targetId: target._id,
      requester: req.user._id,
      owner: target.owner,
      message,
      seats: wanted,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new HttpError(409, 'CONFLICT', 'You already have a pending request for this post.');
    }
    throw err;
  }

  const skills = req.user.skills?.length ? ` Skills: ${req.user.skills.join(', ')}.` : '';
  await notify({
    userId: target.owner,
    type: 'request_new',
    title: clip(`${req.user.name} sent a request for "${target.displayTitle}"`, 190),
    body: clip(`${req.user.department}. ${message}${skills}`, 950),
    link: '/me/requests?tab=incoming',
  });

  request.requester = req.user;
  ok(res, toRequestJSON(request, target), 201);
}

async function listFor(side, req, res) {
  const { status, page, limit } = req.query;
  const filter = { [side]: req.user._id };
  if (status) filter.status = status;
  const result = await paginate(
    InterestRequest.find(filter).sort({ createdAt: -1 }).populate('requester').populate('owner'),
    { page, limit },
  );
  const items = await Promise.all(
    result.items.map(async (r) => toRequestJSON(r, await getTarget(r.targetType, r.targetId))),
  );
  ok(res, { ...result, items });
}

// GET /api/requests/incoming  (requests for posts I own)
export const incoming = (req, res) => listFor('owner', req, res);
// GET /api/requests/outgoing  (requests I sent)
export const outgoing = (req, res) => listFor('requester', req, res);

// PATCH /api/requests/:id  { decision }  (post owner only)
export async function decideRequest(req, res) {
  const request = await loadRequest(req.params.id);
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found.');
  if (String(request.owner) !== String(req.user._id)) throw new HttpError(403, 'FORBIDDEN', 'Only the post owner can answer this request.');
  if (request.status !== 'pending') throw new HttpError(409, 'CONFLICT', 'This request has already been answered.');

  const { decision } = req.body;
  // Claim the request first, atomically, so a double click or two tabs can't decide it twice.
  const claimed = await InterestRequest.findOneAndUpdate(
    { _id: request._id, status: 'pending' },
    { $set: { status: decision, decidedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!claimed) throw new HttpError(409, 'CONFLICT', 'This request has already been answered.');

  if (decision === 'approved') {
    try {
      await applyApproval(claimed);
    } catch (err) {
      // The post couldn't take it (full, closed). Put the request back so the owner can decline it.
      await InterestRequest.updateOne({ _id: claimed._id }, { $set: { status: 'pending' }, $unset: { decidedAt: 1 } });
      throw err;
    }
  }

  const target = await getTarget(claimed.targetType, claimed.targetId);
  await notify({
    userId: claimed.requester,
    type: 'request_decision',
    title: decision === 'approved' ? 'Your request was accepted' : 'Your request was declined',
    body: decision === 'approved'
      ? `"${target?.displayTitle ?? 'The post'}": open My requests to see their contact details.`
      : `"${target?.displayTitle ?? 'The post'}": the owner declined this time.`,
    link: '/me/requests?tab=sent',
  });

  await claimed.populate('requester');
  await claimed.populate('owner');
  ok(res, toRequestJSON(claimed, target));
}

// PATCH /api/requests/:id/withdraw  (requester only, while pending)
export async function withdrawRequest(req, res) {
  const request = await loadRequest(req.params.id);
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found.');
  if (String(request.requester) !== String(req.user._id)) throw new HttpError(403, 'FORBIDDEN', 'You can only withdraw your own requests.');

  const updated = await InterestRequest.findOneAndUpdate(
    { _id: request._id, status: 'pending' },
    { $set: { status: 'withdrawn', decidedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!updated) throw new HttpError(409, 'CONFLICT', 'Only a pending request can be withdrawn.');

  const target = await getTarget(updated.targetType, updated.targetId);
  await notify({
    userId: updated.owner,
    type: 'status_update',
    title: clip(`${req.user.name} withdrew their request`, 190),
    body: target?.displayTitle ?? '',
    link: '/me/requests?tab=incoming',
  });
  await updated.populate('requester');
  await updated.populate('owner');
  ok(res, toRequestJSON(updated, target));
}

// GET /api/requests/:id/contact  (requester or owner, approved only)
export async function requestContact(req, res) {
  const request = await loadRequest(req.params.id);
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found.');
  const me = String(req.user._id);
  const isRequester = String(request.requester) === me;
  const isOwner = String(request.owner) === me;
  if (!isRequester && !isOwner) throw new HttpError(403, 'FORBIDDEN', 'You cannot see these details.');
  if (request.status !== 'approved') {
    throw new HttpError(403, 'FORBIDDEN', 'Contact details are shared only after the request is accepted.');
  }

  const other = await User.findById(isRequester ? request.owner : request.requester);
  const contact = toContact(other);
  if (!contact) throw new HttpError(404, 'NOT_FOUND', 'That member no longer exists.');

  // Lost & Found: the poster chose which detail to share (email or phone) for claims.
  if (isRequester && request.targetType === 'lostfound') {
    const target = await getTarget('lostfound', request.targetId);
    const method = target?.get?.('contactMethod') ?? target?.contactMethod;
    if (method === 'phone' && contact.phone) delete contact.email;
    else if (method === 'email') delete contact.phone;
  }
  ok(res, { contact });
}
