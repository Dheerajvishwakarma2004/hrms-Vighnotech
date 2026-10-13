import { baseApi, provideListTags, selectData, selectList } from '@/services/baseApi';
import { cleanParams } from '@/lib/query';
import { LEAVE_CALENDAR_TAG, LEAVE_LIST_TAG } from '@/features/leaves/leavesApi';

const EMPLOYEE_LIST = { type: 'Employee', id: 'LIST' };
const ATTENDANCE_LIST = { type: 'Attendance', id: 'LIST' };

/**
 * Attendance rows, leave requests and the approved-leave calendar embed employee details
 * (name, department, role, ...) — and deleting an employee deletes their records — so any change
 * to an employee also refreshes them.
 */
const RELATED_LISTS = [ATTENDANCE_LIST, LEAVE_LIST_TAG, LEAVE_CALENDAR_TAG];

const idTags = (type, records = []) => records.filter((record) => record?._id).map(({ _id }) => ({ type, id: _id }));

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params = {}) => ({
        url: '/employees',
        params: cleanParams(params),
      }),
      transformResponse: selectList,
      providesTags: provideListTags('Employee'),
    }),

    getEmployeeSummary: builder.query({
      query: (id) => `/employees/${id}/summary`,
      transformResponse: selectData,
      providesTags: (result, _error, id) => [
        { type: 'Employee', id },
        ATTENDANCE_LIST,
        LEAVE_LIST_TAG,
        ...idTags('Attendance', result?.attendance?.recent),
        ...idTags('Leave', result?.leaves?.recent),
      ],
    }),

    createEmployee: builder.mutation({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      transformResponse: selectData,
      invalidatesTags: [EMPLOYEE_LIST, ATTENDANCE_LIST, 'Dashboard', 'Meta'],
    }),

    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: selectData,
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: 'Employee', id }, EMPLOYEE_LIST, ...RELATED_LISTS, 'Dashboard', 'Meta'],
    }),

    assignEmployeeRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/employees/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      transformResponse: selectData,
      /** Optimistically updates the role in every cached employee list page; rolls back on failure. */
      async onQueryStarted({ id, role }, { dispatch, getState, queryFulfilled }) {
        const patches = employeesApi.util
          .selectInvalidatedBy(getState(), [{ type: 'Employee', id }])
          .filter(({ endpointName }) => endpointName === 'getEmployees')
          .map(({ originalArgs }) =>
            dispatch(
              employeesApi.util.updateQueryData('getEmployees', originalArgs, (draft) => {
                const employee = draft.items.find((item) => item._id === id);
                if (employee) employee.role = role;
              }),
            ),
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: 'Employee', id }, EMPLOYEE_LIST, ...RELATED_LISTS],
    }),

    deleteEmployee: builder.mutation({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      transformResponse: selectData,
      invalidatesTags: (_result, error, id) =>
        error ? [] : [{ type: 'Employee', id }, EMPLOYEE_LIST, ...RELATED_LISTS, 'Dashboard', 'Meta'],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeSummaryQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useAssignEmployeeRoleMutation,
  useDeleteEmployeeMutation,
} = employeesApi;
