import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { useLogoutMutation } from '../authApi';
import { logout } from '../authSlice';

/**
 * Manual logout. The session is cleared immediately; the API is notified in the background
 * (best-effort — JWTs are stateless, so a slow or offline server must not keep the user signed in).
 */
export function useLogout() {
  const dispatch = useDispatch();
  const store = useStore();
  const [logoutRequest] = useLogoutMutation();

  return useCallback(() => {
    // The token is captured before it is cleared so the background request is still authenticated.
    logoutRequest(store.getState().auth.token);
    dispatch(logout({ reason: 'manual' }));
  }, [dispatch, logoutRequest, store]);
}
