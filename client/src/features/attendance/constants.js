import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

/** Upper bound for a task description — mirrors the server validator. */
export const TASK_MAX_LENGTH = 500;

/** Number of days shown in an employee's attendance history. */
export const HISTORY_DAYS = 30;

/** URL-backed roster filters. `date: ''` means "today", so shared links without a date always open on the current day. */
export const ATTENDANCE_FILTER_DEFAULTS = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  search: "",
  date: "",
  department: "",
  role: "",
  position: "",
  status: "",
  sortBy: "fullName",
  sortOrder: "asc",
};

/** Keys that are not counted as "active filters" (they are navigation/view state, not narrowing filters). */
export const NON_FILTER_KEYS = ["page", "limit", "sortBy", "sortOrder", "date"];

/** Every sortable roster column is text, so each starts A→Z. */
export const ASCENDING_FIRST_SORT_KEYS = [
  "fullName",
  "position",
  "department",
  "role",
];
