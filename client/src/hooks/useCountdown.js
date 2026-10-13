import { useEffect, useState } from 'react';

/** Milliseconds remaining until `targetMs` (epoch), re-rendering every `intervalMs`. */
export function useCountdown(targetMs, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetMs) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [targetMs, intervalMs]);

  return targetMs ? Math.max(0, targetMs - now) : 0;
}
