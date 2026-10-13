import { env } from '../config/env.js';

const HEALTH_PATH = '/api/health';
const REQUEST_TIMEOUT_MS = 10_000;
const MINUTE_MS = 60 * 1000;

/**
 * Free hosting (e.g. Render) puts a web service to sleep after ~15 minutes without incoming traffic.
 * This pings the service's own PUBLIC health URL on an interval so it counts as traffic and the app stays awake.
 *
 * It does nothing when no public URL is configured (local development, tests). It cannot wake a service that is
 * already asleep, only prevent it from going to sleep, so the first ping is sent after one full interval.
 *
 * @param {{ baseUrl?: string, intervalMinutes?: number, fetchImpl?: typeof fetch }} [options]
 * @returns {() => void} stop function
 */
export const startKeepAlive = ({
  baseUrl = env.KEEP_ALIVE_BASE_URL,
  intervalMinutes = env.KEEP_ALIVE_INTERVAL_MINUTES,
  fetchImpl = fetch,
} = {}) => {
  if (!baseUrl) return () => {};

  const url = `${baseUrl}${HEALTH_PATH}`;

  const ping = async () => {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) console.warn(`[keep-alive] ${url} answered ${res.status}`);
    } catch (err) {
      console.warn(`[keep-alive] ping failed: ${err.message}`);
    }
  };

  const timer = setInterval(ping, intervalMinutes * MINUTE_MS);
  timer.unref(); // never keeps the process alive on its own
  console.log(`[keep-alive] pinging ${url} every ${intervalMinutes} min`);

  return () => clearInterval(timer);
};
