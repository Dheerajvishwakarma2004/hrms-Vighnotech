import { baseApi, selectData } from '@/services/baseApi';

const EMPTY_OPTIONS = Object.freeze({
  departments: [],
  roles: [],
  candidateStatuses: [],
  employmentTypes: [],
  employeeStatuses: [],
  attendanceStatuses: [],
  leaveTypes: [],
  leaveStatuses: [],
  positions: [],
});

export const metaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOptions: builder.query({
      query: () => '/meta/options',
      transformResponse: (response) => ({ ...EMPTY_OPTIONS, ...selectData(response) }),
      providesTags: ['Meta'],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useGetOptionsQuery } = metaApi;

/**
 * Dropdown options from the API with safe empty-array defaults while loading.
 * @returns {{ options: typeof EMPTY_OPTIONS, isLoading: boolean, isError: boolean, error: unknown, refetch: Function }}
 */
export function useMetaOptions() {
  const { data, isLoading, isError, error, refetch } = useGetOptionsQuery();
  return { options: data ?? EMPTY_OPTIONS, isLoading, isError, error, refetch };
}
