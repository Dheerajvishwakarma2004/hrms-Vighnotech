import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { baseApi } from '@/services/baseApi';
import authReducer, { logout, sessionVerified, setCredentials } from '@/features/auth/authSlice';
import { clearPersistedAuth, persistAuth } from '@/features/auth/authStorage';
import uiReducer from './uiSlice';

const LOGOUT_TOASTS = {
  expired: () => toast.error('Session expired, please log in again', { id: 'session' }),
  manual: () => toast.success('You have been logged out', { id: 'session' }),
  remote: () => toast('You were logged out in another tab', { id: 'session' }),
};

const authListener = createListenerMiddleware();

// Keep localStorage ('hrms_auth') in sync with the auth slice.
authListener.startListening({
  matcher: isAnyOf(setCredentials, sessionVerified),
  effect: (_action, listenerApi) => {
    const { user, token, expiresAt } = listenerApi.getState().auth;
    if (token) persistAuth({ user, token, expiresAt });
  },
});

// Single place that reacts to every logout: clear storage, notify, and drop all cached server data.
authListener.startListening({
  actionCreator: logout,
  effect: async (action, listenerApi) => {
    clearPersistedAuth();
    LOGOUT_TOASTS[action.payload.reason]?.();
    // Let protected routes unmount first so no subscribed query refetches without a token.
    await listenerApi.delay(0);
    listenerApi.dispatch(baseApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(authListener.middleware).concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
});
