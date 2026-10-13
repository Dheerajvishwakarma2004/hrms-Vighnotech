import { baseApi, provideListTags, selectData, selectList } from '@/services/baseApi';
import { toFormData } from '@/lib/formData';
import { cleanParams } from '@/lib/query';
import { MOVE_TO_EMPLOYEE_STATUS } from './constants';

const CANDIDATE_LIST = { type: 'Candidate', id: 'LIST' };
const EMPLOYEE_LIST = { type: 'Employee', id: 'LIST' };
/** A moved candidate becomes an active employee, so they also appear on the attendance sheet. */
const ATTENDANCE_LIST = { type: 'Attendance', id: 'LIST' };
const MOVED_TAGS = [EMPLOYEE_LIST, ATTENDANCE_LIST, 'Meta'];

/**
 * Tags to refresh after a candidate mutation. A 404 means the record is already gone (e.g. deleted in
 * another tab), so the lists are refreshed then too; any other error left the server unchanged.
 */
function candidateChangeTags(error, extraTags = []) {
  if (error && error.status !== 404) return [];
  return [CANDIDATE_LIST, 'Dashboard', ...extraTags];
}

export const candidatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCandidates: builder.query({
      query: (params = {}) => ({
        url: '/candidates',
        params: cleanParams(params),
      }),
      transformResponse: selectList,
      providesTags: provideListTags('Candidate'),
    }),

    createCandidate: builder.mutation({
      /** @param {object} values candidate fields + `resume` PDF (sent as multipart) */
      query: (values) => ({
        url: '/candidates',
        method: 'POST',
        body: toFormData(values),
      }),
      transformResponse: selectData,
      invalidatesTags: (_result, error) => candidateChangeTags(error, ['Meta']),
    }),

    updateCandidate: builder.mutation({
      /** @param {{ id: string, values: object }} args any subset of fields + optional replacement `resume` */
      query: ({ id, values }) => ({
        url: `/candidates/${id}`,
        method: 'PATCH',
        body: toFormData(values),
      }),
      transformResponse: selectData,
      invalidatesTags: (_result, error) => candidateChangeTags(error, ['Meta']),
    }),

    updateCandidateStatus: builder.mutation({
      /**
       * @param {{ id: string, status: string, role?: string }} args selecting a candidate moves them
       *   to employees (`role` = employee role to assign). Resolves to `{ moved, employee | candidate }`.
       */
      query: ({ id, status, role }) => ({
        url: `/candidates/${id}/status`,
        method: 'PATCH',
        body: role ? { status, role } : { status },
      }),
      transformResponse: selectData,
      invalidatesTags: (result, error) => candidateChangeTags(error, result?.moved ? MOVED_TAGS : []),
      // Plain status changes are applied to every cached list immediately and rolled back on failure.
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        if (status === MOVE_TO_EMPLOYEE_STATUS) return;
        const patches = candidatesApi.util
          .selectInvalidatedBy(getState(), [{ type: 'Candidate', id }])
          .filter(({ endpointName }) => endpointName === 'getCandidates')
          .map(({ originalArgs }) =>
            dispatch(
              candidatesApi.util.updateQueryData('getCandidates', originalArgs, (draft) => {
                const candidate = draft.items.find((item) => item._id === id);
                if (candidate) candidate.status = status;
              }),
            ),
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),

    deleteCandidate: builder.mutation({
      query: (id) => ({ url: `/candidates/${id}`, method: 'DELETE' }),
      transformResponse: selectData,
      invalidatesTags: (_result, error) => candidateChangeTags(error, ['Meta']),
    }),
  }),
});

export const {
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  useUpdateCandidateMutation,
  useUpdateCandidateStatusMutation,
  useDeleteCandidateMutation,
} = candidatesApi;
