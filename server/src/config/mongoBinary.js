// Keeps the MongoDB binary used by tests and the local dev database in one place
// (<repo>/node_modules/.cache/mongodb-memory-server) so it is downloaded only once.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(repoRoot, 'node_modules', '.cache', 'mongodb-memory-server');
