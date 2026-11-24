// MongoDB connection helpers.
import mongoose from 'mongoose';

// Connects mongoose to the given URI.
export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}

// Closes the mongoose connection.
export async function disconnectDb() {
  await mongoose.disconnect();
}
