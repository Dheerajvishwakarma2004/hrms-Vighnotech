import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

/** URL-synced list state for the leave requests (see useUrlFilters). `from`/`to` select overlapping leaves. */
export const LEAVE_FILTER_DEFAULTS = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  search: "",
  status: "",
  leaveType: "",
  department: "",
  from: "",
  to: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

/** Columns that sort A→Z first; dates start with the latest. */
export const ASCENDING_FIRST_SORT_KEYS = ["status"];
