// Test fixtures for posts owned by other parts (Project, LostItem, Ride).
// Inserts raw documents so tests work both before and after the real models are merged.
import mongoose from 'mongoose';

const schemaFor = (titleField) => {
  const schema = new mongoose.Schema(
    { owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, isRemoved: { type: Boolean, default: false } },
    { strict: false, timestamps: true },
  );
  schema.virtual('displayTitle').get(function displayTitle() {
    return this.get(titleField);
  });
  return schema;
};

// Returns the registered model, or registers a minimal stand-in with the contract's name.
export function postModel(name, titleField) {
  return mongoose.models[name] || mongoose.model(name, schemaFor(titleField));
}

// Inserts a post without running the owner part's validation. Returns its id.
export async function insertPost(name, titleField, doc) {
  const Model = postModel(name, titleField);
  const { insertedId } = await Model.collection.insertOne({ isRemoved: false, createdAt: new Date(), ...doc });
  return insertedId;
}

export const insertProject = (doc) => insertPost('Project', 'title', doc);
