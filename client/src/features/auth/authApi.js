import { baseApi, selectData } from '@/services/baseApi';
import { sessionVerified, setCredentials } from './authSlice';

async function storeCredentials(_args, { dispatch, queryFulfilled }) {
  try {
    const { data } = await queryFulfilled;
    dispatch(setCredentials(data));
  } catch {
    // Errors are surfaced to the calling form via the mutation result.
  }
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
      transformResponse: selectData,
      onQueryStarted: storeCredentials,
    }),
    register: builder.mutation({
      query: (payload) => ({ url: '/auth/register', method: 'POST', body: payload }),
      transformResponse: selectData,
      onQueryStarted: storeCredentials,
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      transformResponse: selectData,
      providesTags: ['Auth'],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionVerified(data));
        } catch {
          // A 401 here is handled globally by the base query (logout + toast).
        }
      },
    }),
    /** @param {string} token the session's token, passed explicitly because the session is cleared right away */
    logout: builder.mutation({
      query: (token) => ({ url: '/auth/logout', method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetMeQuery, useLogoutMutation } = authApi;
