import { baseApi, selectData, selectList } from "@/services/baseApi";
import { cleanParams } from "@/lib/query";
import { NOT_MARKED } from "@/lib/constants";

const ROSTER_TAG = { type: "Attendance", id: "LIST" };
const historyTag = (employeeId) => ({
  type: "Attendance",
  id: `EMPLOYEE-${employeeId}`,
});

/** Everything that shows an employee's attendance: rosters, their history, their profile summary, the dashboard. */
const affectedTags = (employeeId) => [
  ROSTER_TAG,
  historyTag(employeeId),
  { type: "Employee", id: employeeId },
  "Dashboard",
];

/** Only the fields the roster rows carry (`GET /attendance` projects the same shape). */
const toRosterRecord = ({ _id, status, task, date, updatedAt }) => ({
  _id,
  status,
  task,
  date,
  updatedAt,
});

/** Moves one employee between two per-status counters of a cached roster summary. */
function moveSummaryCount(draft, from, to) {
  const summary = draft.meta?.summary;
  if (!summary || from === to) return;
  summary[from] = Math.max(0, (summary[from] ?? 0) - 1);
  summary[to] = (summary[to] ?? 0) + 1;
}

/**
 * Applies `recipe(row, draft)` to the employee's row in every cached roster for `date`
 * (any page / filter combination) and returns the patch results so they can be undone.
 */
function patchRosterRow({ dispatch, getState }, { employeeId, date }, recipe) {
  return attendanceApi.util
    .selectCachedArgsForQuery(getState(), "getAttendance")
    .filter((args) => args?.date === date)
    .map((args) =>
      dispatch(
        attendanceApi.util.updateQueryData("getAttendance", args, (draft) => {
          const row = draft.items.find(
            (item) => item.employee._id === employeeId,
          );
          if (row) recipe(row, draft);
        }),
      ),
    );
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Daily roster: active employees joined with their attendance for `date` + per-status summary in `meta`. */
    getAttendance: builder.query({
      query: (params) => ({ url: "/attendance", params: cleanParams(params) }),
      transformResponse: selectList,
      providesTags: [ROSTER_TAG],
    }),

    /** One employee's records between `from` and `to` (newest first). */
    getEmployeeAttendance: builder.query({
      query: ({ employeeId, ...params }) => ({
        url: `/attendance/employee/${employeeId}`,
        params: cleanParams(params),
      }),
      transformResponse: selectData,
      providesTags: (_result, _error, { employeeId }) => [
        historyTag(employeeId),
      ],
    }),

    /** Creates or updates the record for (employee, date). Optimistically updates the cached rosters. */
    upsertAttendance: builder.mutation({
      query: (body) => ({ url: "/attendance", method: "PUT", body }),
      transformResponse: selectData,
      async onQueryStarted({ employeeId, date, status, task }, api) {
        const patches = patchRosterRow(
          api,
          { employeeId, date },
          (row, draft) => {
            moveSummaryCount(
              draft,
              row.attendance?.status ?? NOT_MARKED,
              status,
            );
            row.attendance = {
              ...row.attendance,
              status,
              task: task ?? row.attendance?.task ?? "",
              date: row.attendance?.date ?? date,
              updatedAt: new Date().toISOString(),
            };
          },
        );
        try {
          const { data } = await api.queryFulfilled;
          // Swap the optimistic record for the saved one (gives new records their id right away).
          patchRosterRow(api, { employeeId, date }, (row) => {
            row.attendance = toRosterRecord(data);
          });
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, error, { employeeId }) =>
        error ? [ROSTER_TAG] : affectedTags(employeeId),
    }),

    /** Deletes a record so the employee shows as "Not Marked" again. Optimistic like the upsert. */
    deleteAttendance: builder.mutation({
      query: ({ id }) => ({ url: `/attendance/${id}`, method: "DELETE" }),
      transformResponse: selectData,
      async onQueryStarted({ employeeId, date }, api) {
        const patches = patchRosterRow(
          api,
          { employeeId, date },
          (row, draft) => {
            if (!row.attendance) return;
            moveSummaryCount(draft, row.attendance.status, NOT_MARKED);
            row.attendance = null;
          },
        );
        try {
          await api.queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, error, { employeeId }) =>
        error ? [ROSTER_TAG] : affectedTags(employeeId),
    }),
  }),
});

export const {
  useGetAttendanceQuery,
  useGetEmployeeAttendanceQuery,
  useUpsertAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApi;
