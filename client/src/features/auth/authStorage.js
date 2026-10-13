import { AUTH_STORAGE_KEY } from '@/lib/constants';

/**
 * Reads the persisted session. Returns `{ session, expired }` where `session` is
 * `{ user, token, expiresAt }` or null. Already-expired or malformed sessions are discarded.
 */
export function readPersistedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { session: null, expired: false };

    const parsed = JSON.parse(raw);
    const valid = parsed && typeof parsed.token === 'string' && Number.isFinite(parsed.expiresAt);
    if (!valid) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { session: null, expired: false };
    }
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { session: null, expired: true };
    }
    return { session: { user: parsed.user ?? null, token: parsed.token, expiresAt: parsed.expiresAt }, expired: false };
  } catch {
    return { session: null, expired: false };
  }
}

export function persistAuth({ user, token, expiresAt }) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token, expiresAt }));
  } catch {
    // Storage unavailable (private mode / quota) — the session still works for this tab.
  }
}

export function clearPersistedAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
