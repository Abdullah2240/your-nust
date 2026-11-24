// Loaded with --import before every test file, so config sees NODE_ENV=test.
import '../src/config/mongoBinary.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
