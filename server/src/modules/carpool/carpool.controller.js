import mongoose from 'mongoose';
import { HttpError, ok, paginate } from '../../lib/http.js';
import { escapeRegex } from '../../lib/regex.js';
import { notify, notifyAdmins } from '../notifications/notify.js';
import { InterestRequest } from '../requests/request.model.js';
import { Ride } from './ride.model.js';
import { isRideOwnerOrAdmin, toRideJSON } from './ride.view.js';

const TWO_HOURS = 2 * 60 * 60 * 1000;

async function findRide(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Ride.findById(id).populate('owner');
}

// GET /api/carpool  (verified members; approved and not removed only)
export async function listRides(req, res) {
  const { kind, frequency, status, q, page = 1, limit = 12 } = req.query;
  const base = { approval: 'approved', isRemoved: false };
  if (kind) base.kind = kind;
  // With no status filter we show rides that can still be joined or are full, not finished or cancelled ones.
  base.status = status || { $in: ['Active', 'Full'] };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    base.$or = [{ origin: rx }, { destination: rx }];
  }

  const oneTimeFilter = { ...base, frequency: 'one-time' };
  // Rides that left more than two hours ago are hidden unless someone asks for a specific status.
  if (!status) oneTimeFilter.departAt = { $gte: new Date(Date.now() - TWO_HOURS) };

  const [oneTime, recurring] = await Promise.all([
    frequency === 'recurring' ? [] : Ride.find(oneTimeFilter).sort({ departAt: 1 }).populate('owner'),
    frequency === 'one-time' ? [] : Ride.find({ ...base, frequency: 'recurring' }).sort({ createdAt: -1 }).populate('owner'),
  ]);

  const all = [...oneTime, ...recurring];
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const items = all.slice((safePage - 1) * safeLimit, safePage * safeLimit).map((r) => toRideJSON(r, req.user));
  ok(res, { items, total: all.length, page: safePage, pages: Math.max(Math.ceil(all.length / safeLimit), 1) });
}

// GET /api/carpool/mine
export async function myRides(req, res) {
  const { page, limit } = req.query;
  const result = await paginate(Ride.find({ owner: req.user._id }).sort({ createdAt: -1 }).populate('owner'), { page, limit });
  ok(res, { ...result, items: result.items.map((r) => toRideJSON(r, req.user)) });
}

// GET /api/carpool/:id
export async function getRide(req, res) {
  const ride = await findRide(req.params.id);
  const visible = ride && (isRideOwnerOrAdmin(ride, req.user) || (ride.approval === 'approved' && !ride.isRemoved));
  if (!visible) throw new HttpError(404, 'NOT_FOUND', 'That ride does not exist or is no longer available.');
  ok(res, toRideJSON(ride, req.user));
}

// POST /api/carpool
export async function createRide(req, res) {
  const body = req.body;
  const recurringRide = body.frequency === 'recurring';
  const ride = await Ride.create({
    ...body,
    owner: req.user._id,
    status: 'Active',
    approval: recurringRide ? 'pending' : 'approved',
  });
  if (recurringRide) {
    await notifyAdmins({
      type: 'admin_queue',
      title: 'A recurring ride is waiting for approval',
      body: `${ride.displayTitle} by ${req.user.name}`,
      link: '/admin/ride-approvals',
    });
  }
  await ride.populate('owner');
  ok(res, toRideJSON(ride, req.user), 201);
}

// PATCH /api/carpool/:id  (owner: status, seats, notes)
export async function updateRide(req, res) {
  const ride = await findRide(req.params.id);
  if (!ride || ride.isRemoved) throw new HttpError(404, 'NOT_FOUND', 'That ride does not exist.');
  if (String(ride.owner._id) !== String(req.user._id)) throw new HttpError(403, 'FORBIDDEN', 'Only the poster can edit this ride.');
  if (['Completed', 'Cancelled'].includes(ride.status)) {
    throw new HttpError(409, 'CONFLICT', `This ride is already ${ride.status.toLowerCase()}.`);
  }

  const { status, seats, notes } = req.body;
  if (seats !== undefined) ride.seats = seats;
  if (notes !== undefined) ride.notes = notes;
  if (status !== undefined) ride.status = status;
  // Keep Active/Full in step with the seat count unless the owner is finishing or cancelling the ride.
  if (ride.kind === 'offer' && !['Completed', 'Cancelled'].includes(ride.status)) {
    if (ride.seats === 0) ride.status = 'Full';
    else if (ride.status === 'Full') ride.status = 'Active';
  }
  await ride.save();

  if (status === 'Cancelled' || status === 'Completed') {
    const approved = await InterestRequest.find({ targetType: 'carpool', targetId: ride._id, status: 'approved' });
    await Promise.all(
      approved.map((r) =>
        notify({
          userId: r.requester,
          type: 'status_update',
          title: status === 'Cancelled' ? 'A ride you joined was cancelled' : 'A ride you joined is complete',
          body: ride.displayTitle,
          link: `/carpool/${ride.id}`,
        }),
      ),
    );
  }
  ok(res, toRideJSON(ride, req.user));
}

// GET /api/carpool/admin/pending
export async function pendingRides(req, res) {
  const { page, limit } = req.query;
  const result = await paginate(Ride.find({ approval: 'pending', isRemoved: false }).sort({ createdAt: 1 }).populate('owner'), { page, limit });
  ok(res, { ...result, items: result.items.map((r) => toRideJSON(r, req.user)) });
}

// PATCH /api/carpool/:id/approval  (admin)
export async function decideRide(req, res) {
  const ride = await findRide(req.params.id);
  if (!ride || ride.isRemoved) throw new HttpError(404, 'NOT_FOUND', 'That ride does not exist.');
  if (ride.approval !== 'pending') throw new HttpError(409, 'CONFLICT', 'This ride has already been reviewed.');

  const { decision, reason } = req.body;
  ride.approval = decision;
  ride.rejectionReason = decision === 'rejected' ? reason : '';
  await ride.save();

  await notify({
    userId: ride.owner._id,
    type: decision === 'approved' ? 'post_approved' : 'post_rejected',
    title: decision === 'approved' ? 'Your recurring ride is live' : 'Your recurring ride was not approved',
    body: decision === 'approved' ? `${ride.displayTitle} is now visible to members.` : `${ride.displayTitle}: ${reason}`,
    link: `/carpool/${ride.id}`,
  });
  ok(res, toRideJSON(ride, req.user));
}
