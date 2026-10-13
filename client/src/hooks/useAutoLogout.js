import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { logout, selectExpiresAt, selectToken, setCredentials } from '@/features/auth/authSlice';
import { readPersistedAuth } from '@/features/auth/authStorage';
import { AUTH_STORAGE_KEY } from '@/lib/constants';

/** setTimeout overflows above ~24.8 days; longer sessions are re-armed in chunks. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** Storage sync within this margin of `expiresAt` counts as a natural expiry (timers drift between tabs). */
const EXPIRY_GRACE_MS = 5_000;

/**
 * Ends the session exactly when the JWT expires (2 h after login), even if the user is idle.
 * - Arms a timer for `expiresAt - now`; on fire dispatches `logout({ reason: 'expired' })`
 *   (the auth listener toasts, ProtectedRoute redirects to /login).
 * - Re-checks when the tab becomes visible again (background timers can be throttled / device sleep).
 * - Syncs login/logout across tabs through the `storage` event. When another tab clears storage because the
 *   session ran out (its timer fired first — background timers are throttled), this tab reports it as
 *   'expired' too, not as a logout in another tab.
 * Mount once at the app root.
 */
export function useAutoLogout() {
  const dispatch = useDispatch();
  const store = useStore();
  const token = useSelector(selectToken);
  const expiresAt = useSelector(selectExpiresAt);

  useEffect(() => {
    if (!token || !expiresAt) return undefined;

    let timer;
    const expireIfDue = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        dispatch(logout({ reason: 'expired' }));
        return;
      }
      timer = setTimeout(expireIfDue, Math.min(remaining, MAX_TIMEOUT_MS));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() >= expiresAt) {
        clearTimeout(timer);
        dispatch(logout({ reason: 'expired' }));
      }
    };

    expireIfDue();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token, expiresAt, dispatch]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.storageArea !== localStorage || (event.key !== AUTH_STORAGE_KEY && event.key !== null)) return;

      const { token: currentToken, expiresAt: currentExpiresAt } = store.getState().auth;
      const { session } = readPersistedAuth();

      if (!session) {
        if (!currentToken) return;
        const expired = Boolean(currentExpiresAt) && currentExpiresAt - Date.now() <= EXPIRY_GRACE_MS;
        dispatch(logout({ reason: expired ? 'expired' : 'remote' }));
      } else if (session.token !== currentToken) {
        dispatch(setCredentials(session));
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [dispatch, store]);
}
