// npm run seed: wipes the dev database and loads seed data.
// Module seeds (cafeterias, lostfound, projects, carpool) run only once their file exists.
// Each exports: export default async function seed({ users }) { ... }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import seedUsers, { SEED_PASSWORD } from './users.seed.js';

if (env.isProd && !process.argv.includes('--force')) {
  console.error('Refusing to wipe a production database. Re-run with --force if you really mean it.');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const MODULE_SEEDS = ['cafeterias', 'lostfound', 'projects', 'carpool'];

await connectDb(env.mongoUri);
await mongoose.connection.dropDatabase();
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

const users = await seedUsers();
console.log(`Seeded 4 users (password for all: ${SEED_PASSWORD})`);

for (const name of MODULE_SEEDS) {
  const file = path.join(here, `${name}.seed.js`);
  if (!fs.existsSync(file)) continue;
  const { default: seed } = await import(pathToFileURL(file).href);
  const result = await seed({ users });
  console.log(`Seeded ${name}${typeof result === 'number' ? ` (${result} records)` : ''}`);
}

await disconnectDb();
console.log('Done.');
