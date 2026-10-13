import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { startKeepAlive } from './services/keepAlive.service.js';
import { isMainModule } from './utils/isMainModule.js';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'];

/**
 * Connects to MongoDB and starts the HTTP server.
 * @param {{ mongoUri?: string, port?: number, beforeListen?: () => Promise<void>, onShutdown?: () => Promise<void> }} options
 */
export const startServer = async ({
  mongoUri = env.MONGODB_URI,
  port = env.PORT,
  beforeListen,
  onShutdown,
} = {}) => {
  await connectDB(mongoUri);
  console.log('[db] MongoDB connected');

  if (beforeListen) await beforeListen();

  const server = await new Promise((resolve, reject) => {
    const httpServer = app.listen(port, () => resolve(httpServer));
    httpServer.once('error', reject);
  });
  console.log(`[server] HRMS API listening on http://localhost:${port} (${env.NODE_ENV})`);

  const stopKeepAlive = startKeepAlive();

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[server] ${signal} received - shutting down`);
    stopKeepAlive();
    server.close();
    await disconnectDB();
    if (onShutdown) await onShutdown();
    process.exit(0);
  };
  SHUTDOWN_SIGNALS.forEach((signal) => process.once(signal, () => shutdown(signal)));

  return server;
};

if (isMainModule(import.meta.url)) {
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled rejection:', reason);
    process.exit(1);
  });

  startServer().catch((err) => {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  });
}
