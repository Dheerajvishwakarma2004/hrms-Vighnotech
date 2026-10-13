/*
 * Zero-setup development server: starts an in-memory MongoDB, seeds demo data and starts the API.
 * Data lives only for the lifetime of this process.  Usage: `npm run dev:memory` (honours PORT).
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer } from '../server.js';
import { DEMO_HR, seedDatabase } from './seed.js';

const DB_NAME = 'hrms';

const run = async () => {
  console.log('[dev:memory] Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();

  try {
    await startServer({
      mongoUri: mongod.getUri(DB_NAME),
      beforeListen: async () => {
        const summary = await seedDatabase();
        console.log('[dev:memory] Seeded demo data:', summary);
        console.log(`[dev:memory] Login with ${DEMO_HR.email} / ${DEMO_HR.password}`);
      },
      onShutdown: () => mongod.stop(),
    });
  } catch (err) {
    await mongod.stop();
    throw err;
  }
};

run().catch((err) => {
  console.error('[dev:memory] Failed to start:', err);
  process.exit(1);
});
