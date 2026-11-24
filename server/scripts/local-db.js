// Starts a local MongoDB on port 27017 with data kept in server/.data/db, so nobody has to
// install MongoDB. Skipped when MONGO_URI points somewhere else (e.g. Atlas) or 27017 is busy.
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import '../src/config/mongoBinary.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from '../src/config/env.js';

const LOCAL = /^mongodb:\/\/(127\.0\.0\.1|localhost):27017\//;

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

if (!LOCAL.test(env.mongoUri)) {
  console.log('Using MONGO_URI from server/.env, so the built-in local database is not needed.');
  process.exit(0);
}
if (await portInUse(27017)) {
  console.log('A MongoDB is already running on port 27017. Using it.');
  process.exit(0);
}

const dbPath = path.join(env.serverRoot, '.data', 'db');
fs.mkdirSync(dbPath, { recursive: true });
console.log('Starting the built-in local database (first run downloads MongoDB, ~100 MB)...');
const server = await MongoMemoryServer.create({
  instance: { port: 27017, ip: '127.0.0.1', dbPath, storageEngine: 'wiredTiger' },
});
console.log(`Local database ready at ${server.getUri()} (data in server/.data/db)`);

const stop = async () => { await server.stop({ doCleanup: false }); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
