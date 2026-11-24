// Maps a post type to its model and client path. Used by Reports (Part A) and Requests (Part C).
import mongoose from 'mongoose';

export const TARGETS = {
  lostfound: { model: 'LostItem', path: (id) => `/lost-found/${id}` },
  project: { model: 'Project', path: (id) => `/projects/${id}` },
  carpool: { model: 'Ride', path: (id) => `/carpool/${id}` },
};

// Returns the target document, or null if the type is unknown, the model isn't registered yet,
// the id is invalid or nothing is found. Never throws for bad input.
export async function getTarget(type, id) {
  const def = TARGETS[type];
  if (!def || !mongoose.isValidObjectId(id)) return null;
  const Model = mongoose.models[def.model];
  if (!Model) return null;
  return Model.findById(id);
}
