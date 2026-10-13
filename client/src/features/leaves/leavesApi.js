import {
  baseApi,
  provideListTags,
  selectData,
  selectList,
} from "@/services/baseApi";
import { cleanParams } from "@/lib/query";
import { toFormData } from "@/lib/formData";

export const LEAVE_LIST_TAG = { type: "Leave", id: "LIST" };
/** Approved-leave calendar ranges (their rows embed employee details too). */
export const LEAVE_CALENDAR_TAG = { type: "Leave", id: "CALENDAR" };

/**
 * Tags touched by any change to a single leave: the leave itself, every leave list, the approved-leave
 * calendar, dashboard widgets and (when known) the owning employee's summary.
 */
function leaveChangeTags(id, employeeId) {
  const tags = [LEAVE_LIST_TAG, LEAVE_CALENDAR_TAG, "Dashboard"];
  if (id) tags.push({ type: "Leave", id });
  if (employeeId) tags.push({ type: "Employee", id: employeeId });
  return tags;
}

/** Refetch after success, or after a 404 (the cached row is stale — someone else removed it). */
const shouldInvalidate = (error) => !error || error.status === 404;

export const leavesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaves: builder.query({
      query: (params = {}) => ({ url: "/leaves", params: cleanParams(params) }),
      transformResponse: selectList,
      providesTags: provideListTags("Leave"),
    }),

    /** Approved leaves overlapping `[start, end]` (YYYY-MM-DD) — powers the leave calendar. */
    getLeaveCalendar: builder.query({
      query: ({ start, end }) => ({
        url: "/leaves/calendar",
        params: { start, end },
      }),
      transformResponse: (response) => selectData(response) ?? [],
      providesTags: (result = []) => [
        LEAVE_CALENDAR_TAG,
        ...result.map((leave) => ({ type: "Leave", id: leave._id })),
      ],
    }),

    /** Active employees for the leave form's employee picker. */
    searchLeaveEmployees: builder.query({
      query: ({ search = "", limit = 20 } = {}) => ({
        url: "/employees",
        params: cleanParams({
          search,
          status: "Active",
          limit,
          sortBy: "fullName",
          sortOrder: "asc",
        }),
      }),
      transformResponse: (response) => selectData(response) ?? [],
      providesTags: [{ type: "Employee", id: "LIST" }],
      keepUnusedDataFor: 120,
    }),

    createLeave: builder.mutation({
      query: (values) => ({
        url: "/leaves",
        method: "POST",
        body: toFormData(values),
      }),
      transformResponse: selectData,
      invalidatesTags: (_result, error, values) =>
        shouldInvalidate(error) ? leaveChangeTags(null, values.employeeId) : [],
    }),

    updateLeave: builder.mutation({
      query: ({ id, values }) => ({
        url: `/leaves/${id}`,
        method: "PATCH",
        body: toFormData(values),
      }),
      transformResponse: selectData,
      invalidatesTags: (_result, error, { id, values, previousEmployeeId }) => {
        if (!shouldInvalidate(error)) return [];
        const tags = leaveChangeTags(id, values.employeeId);
        if (previousEmployeeId && previousEmployeeId !== values.employeeId) {
          tags.push({ type: "Employee", id: previousEmployeeId });
        }
        return tags;
      },
    }),

    /**
     * Inline status change. The new status is applied optimistically to every cached leave list
     * (rolled back on failure); lists and the calendar are then refetched through tag invalidation.
     */
    updateLeaveStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/leaves/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: selectData,
      async onQueryStarted(
        { id, status },
        { dispatch, getState, queryFulfilled },
      ) {
        const patches = leavesApi.util
          .selectCachedArgsForQuery(getState(), "getLeaves")
          .map((args) =>
            dispatch(
              leavesApi.util.updateQueryData("getLeaves", args, (draft) => {
                const leave = draft.items.find((item) => item._id === id);
                if (leave) leave.status = status;
              }),
            ),
          );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, error, { id, employeeId }) =>
        shouldInvalidate(error) ? leaveChangeTags(id, employeeId) : [],
    }),

    deleteLeave: builder.mutation({
      query: ({ id }) => ({ url: `/leaves/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error, { id, employeeId }) =>
        shouldInvalidate(error) ? leaveChangeTags(id, employeeId) : [],
    }),
  }),
});

export const {
  useGetLeavesQuery,
  useGetLeaveCalendarQuery,
  useSearchLeaveEmployeesQuery,
  useCreateLeaveMutation,
  useUpdateLeaveMutation,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveMutation,
} = leavesApi;

/** API path of a leave's supporting document (used with `useDownload`). */
export const leaveDocumentPath = (id) => `/leaves/${id}/document`;
