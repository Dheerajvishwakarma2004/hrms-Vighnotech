import { createSlice } from '@reduxjs/toolkit';
import { readPersistedAuth } from './authStorage';

/**
 * `logoutReason` lets the login page explain why the user is there:
 * 'expired' (token expired / 401), 'manual' (user clicked logout), 'remote' (logged out in another tab).
 *
 * The persisted session is read exactly once: reading it discards an expired session from storage, and a lazy
 * initializer would run several times while the store is created (later runs would no longer see "expired").
 */
const { session, expired } = readPersistedAuth();

const initialState = {
  user: session?.user ?? null,
  token: session?.token ?? null,
  expiresAt: session?.expiresAt ?? null,
  logoutReason: expired ? 'expired' : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called after login/register (and when another tab logs in). */
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.token = payload.token;
      state.expiresAt = payload.expiresAt;
      state.logoutReason = null;
    },
    /** Refreshes the user/expiry from `GET /auth/me` without touching the token. */
    sessionVerified(state, { payload }) {
      if (!state.token) return;
      state.user = payload.user;
      if (payload.expiresAt) state.expiresAt = payload.expiresAt;
    },
    logout: {
      reducer(state, { payload }) {
        state.user = null;
        state.token = null;
        state.expiresAt = null;
        state.logoutReason = payload.reason;
      },
      prepare(options = {}) {
        return { payload: { reason: options.reason ?? 'manual' } };
      },
    },
    clearLogoutReason(state) {
      state.logoutReason = null;
    },
  },
});

export const { setCredentials, sessionVerified, logout, clearLogoutReason } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectExpiresAt = (state) => state.auth.expiresAt;
export const selectIsAuthenticated = (state) => Boolean(state.auth.token);
export const selectLogoutReason = (state) => state.auth.logoutReason;
