// Rules about which posts can take requests, and what happens to the post when a request is accepted.
import mongoose from 'mongoose';
import { HttpError } from '../../lib/http.js';

const field = (doc, name) => (typeof doc.get === 'function' ? doc.get(name) : doc[name]);

// Throws a 409 explaining why the post can't take more requests; otherwise returns quietly.
export function assertAcceptingRequests(type, target) {
  if (target.isRemoved) throw new HttpError(409, 'CONFLICT', 'This post is no longer available.');
  const approval = field(target, 'approval');
  if (approval && approval !== 'approved') throw new HttpError(409, 'CONFLICT', 'This post is not live yet.');

  if (type === 'project' && field(target, 'status') !== 'Open') {
    throw new HttpError(409, 'CONFLICT', 'This project is closed to new members.');
  }
  if (type === 'carpool' && field(target, 'status') !== 'Active') {
    throw new HttpError(409, 'CONFLICT', 'This ride is no longer taking requests.');
  }
  if (type === 'lostfound' && field(target, 'status') === 'Resolved') {
    throw new HttpError(409, 'CONFLICT', 'This item has already been resolved.');
  }
}

// Applies the side effect of an accepted request. Throws 409 if the post can't take it any more.
// It uses one atomic update so two accepted requests can never take the last seat or spot together.
export async function applyApproval(request) {
  if (request.targetType === 'project') {
    const Project = mongoose.models.Project;
    const project = await Project.findOneAndUpdate(
      { _id: request.targetId, isRemoved: false, $expr: { $lt: ['$currentMembers', '$teamSize'] } },
      { $inc: { currentMembers: 1 } },
      { returnDocument: 'after' },
    );
    if (!project) throw new HttpError(409, 'CONFLICT', 'The team is already full.');
    if (project.currentMembers >= project.teamSize) {
      await Project.updateOne({ _id: project._id }, { $set: { status: 'Closed' } });
    }
    return;
  }

  if (request.targetType === 'carpool') {
    const Ride = mongoose.models.Ride;
    const ride = await Ride.findById(request.targetId);
    if (!ride || ride.isRemoved || ride.status !== 'Active') {
      throw new HttpError(409, 'CONFLICT', 'This ride is no longer taking requests.');
    }
    if (ride.kind === 'offer') {
      const updated = await Ride.findOneAndUpdate(
        { _id: ride._id, status: 'Active', seats: { $gte: request.seats } },
        { $inc: { seats: -request.seats } },
        { returnDocument: 'after' },
      );
      if (!updated) throw new HttpError(409, 'CONFLICT', 'Not enough seats are left on this ride.');
      if (updated.seats === 0) await Ride.updateOne({ _id: updated._id }, { $set: { status: 'Full' } });
    }
    // A "ride needed" post has no seat count to change. Accepting just shares contact details.
  }
  // lostfound: accepting a claim shares contact details only. Part B decides when an item is resolved.
}
