import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

/** URL-synced list state for the employees page (see useUrlFilters). */
export const EMPLOYEE_FILTER_DEFAULTS = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  search: '',
  department: '',
  role: '',
  position: '',
  status: '',
  employmentType: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/** Columns that sort A→Z first; everything else (dates, numbers) starts with newest/largest. */
export const ASCENDING_FIRST_SORT_KEYS = ['fullName', 'role'];

export const employeeResumePath = (id) => `/employees/${id}/resume`;
