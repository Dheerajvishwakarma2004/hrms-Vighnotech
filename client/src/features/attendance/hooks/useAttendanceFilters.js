import { useCallback, useMemo } from "react";
import {
  countActiveFilters,
  getNextSort,
  useUrlFilters,
} from "@/hooks/useUrlFilters";
import { todayKey } from "@/lib/date";
import { resolveAttendanceDate } from "../utils/dates";
import {
  ASCENDING_FIRST_SORT_KEYS,
  ATTENDANCE_FILTER_DEFAULTS,
  NON_FILTER_KEYS,
} from "../constants";

const NARROWING_KEYS = Object.keys(ATTENDANCE_FILTER_DEFAULTS).filter(
  (key) => !NON_FILTER_KEYS.includes(key),
);
const CLEARED_FILTERS = Object.fromEntries(
  NARROWING_KEYS.map((key) => [key, ""]),
);

/**
 * Attendance roster state kept in the URL (date, search, filters, sort, pagination).
 * Exposes the resolved date (never empty, never in the future) and ready-to-use query args.
 */
export function useAttendanceFilters() {
  const [filters, , , setFilters] = useUrlFilters(ATTENDANCE_FILTER_DEFAULTS);
  const date = resolveAttendanceDate(filters.date);

  const queryArgs = useMemo(() => ({ ...filters, date }), [filters, date]);
  const activeCount = countActiveFilters(
    filters,
    ATTENDANCE_FILTER_DEFAULTS,
    NON_FILTER_KEYS,
  );

  // Today is stored as "no date" so the URL stays clean and bookmarks always open on the current day.
  const setDate = useCallback(
    (key) => setFilters({ date: key === todayKey() ? "" : key }),
    [setFilters],
  );

  const toggleStatus = useCallback(
    (status) => setFilters({ status: filters.status === status ? "" : status }),
    [filters.status, setFilters],
  );

  const setSort = useCallback(
    (sortBy) =>
      setFilters(getNextSort(filters, sortBy, ASCENDING_FIRST_SORT_KEYS)),
    [filters, setFilters],
  );

  // Clears the narrowing filters but keeps the selected date, sort and page size.
  const resetFilters = useCallback(
    () => setFilters(CLEARED_FILTERS),
    [setFilters],
  );

  return {
    filters,
    date,
    queryArgs,
    activeCount,
    setFilters,
    setDate,
    toggleStatus,
    setSort,
    resetFilters,
  };
}
