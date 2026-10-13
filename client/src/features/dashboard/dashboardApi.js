import { baseApi, selectData } from '@/services/baseApi';

/**
 * Fills any missing branch of the stats payload so components can render without null checks.
 * `notMarked` falls back to "active employees without a record" when the server omits it.
 */
function normalizeStats(data = {}) {
  const { candidates = {}, employees = {}, attendance = {}, leaves = {} } = data;
  const active = employees.active ?? 0;
  const marked = attendance.marked ?? 0;

  return {
    candidates: {
      total: candidates.total ?? 0,
      byStatus: candidates.byStatus ?? {},
    },
    employees: {
      total: employees.total ?? 0,
      active,
      byDepartment: employees.byDepartment ?? [],
    },
    attendance: {
      date: attendance.date ?? null,
      marked,
      notMarked: attendance.notMarked ?? Math.max(active - marked, 0),
      byStatus: attendance.byStatus ?? {},
    },
    leaves: {
      pending: leaves.pending ?? 0,
      approvedOnDate: leaves.approvedOnDate ?? [],
      upcomingApproved: leaves.upcomingApproved ?? 0,
    },
    recentCandidates: data.recentCandidates ?? [],
    recentLeaves: data.recentLeaves ?? [],
  };
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** @param {string} date local `YYYY-MM-DD` the attendance / on-leave figures are computed for */
    getDashboardStats: builder.query({
      query: (date) => ({ url: '/dashboard/stats', params: { date } }),
      transformResponse: (response) => normalizeStats(selectData(response)),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
