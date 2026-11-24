import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';

const safeUri = env.mongoUri.replace(/\/\/[^@]*@/, '//***@');

// The local database may still be starting (first run downloads it), so keep retrying in dev.
async function connectWithRetry() {
  const maxAttempts = env.isProd ? 5 : 90;
  for (let attempt = 1; ; attempt++) {
    try {
      await connectDb(env.mongoUri);
      console.log(`MongoDB connected (${safeUri})`);
      return;
    } catch (err) {
      if (attempt >= maxAttempts) {
        console.error(`\nCould not connect to MongoDB at ${safeUri}: ${err.message}`);
        console.error('Run `npm run dev` from the repo root (it starts the local database), or fix MONGO_URI in server/.env.\n');
        process.exit(1);
      }
      if (attempt === 1) console.log('Waiting for the database...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

await connectWithRetry();
createApp().listen(env.port, () => console.log(`API ready on http://localhost:${env.port}`));
