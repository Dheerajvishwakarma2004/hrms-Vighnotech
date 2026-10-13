import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '@/features/auth/authSlice';
import { API_BASE_URL } from '@/lib/constants';

/** Endpoints where a 401 means "wrong credentials", not "session expired". */
const CREDENTIAL_ENDPOINTS = new Set(['login', 'register']);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 30_000,
  prepareHeaders: (headers, { getState }) => {
    const { token } = getState().auth;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Wraps fetchBaseQuery: attaches the Bearer token and, on a 401 from any protected endpoint,
 * ends the session (the auth listener shows the "Session expired" toast and the router redirects to /login).
 */
async function baseQueryWithAuth(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (
    result.error?.status === 401 &&
    !CREDENTIAL_ENDPOINTS.has(api.endpoint) &&
    api.getState().auth.token
  ) {
    api.dispatch(logout({ reason: 'expired' }));
  }

  return result;
}

const TAG_TYPES = ['Auth', 'Candidate', 'Employee', 'Attendance', 'Leave', 'Dashboard', 'Meta'];

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: TAG_TYPES,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** `transformResponse` helper: `{ success, data }` → `data`. */
export const selectData = (response) => response.data;

/** `transformResponse` helper for paginated lists: `{ data, meta }` → `{ items, meta }`. */
export const selectList = (response) => ({
  items: response.data ?? [],
  meta: response.meta ?? { page: 1, limit: response.data?.length ?? 0, total: response.data?.length ?? 0, totalPages: 1 },
});

/** Builds `providesTags` for a list result shaped by `selectList` (or a plain array). */
export function provideListTags(type) {
  return (result) => {
    const items = Array.isArray(result) ? result : result?.items ?? [];
    return [{ type, id: 'LIST' }, ...items.filter((item) => item?._id).map((item) => ({ type, id: item._id }))];
  };
}
