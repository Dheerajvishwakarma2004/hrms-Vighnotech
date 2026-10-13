import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

/** Setting a candidate to this status moves them to the employee list (server business rule). */
export const MOVE_TO_EMPLOYEE_STATUS = 'Selected';

/** Experience bounds enforced by the server (years). */
export const EXPERIENCE_RANGE = { min: 0, max: 50 };

/** URL-synced list state for the candidates page (see useUrlFilters). */
export const CANDIDATE_FILTER_DEFAULTS = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  search: '',
  status: '',
  department: '',
  position: '',
  minExperience: '',
  maxExperience: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/** Sort presets — every combination the table headers can produce is listed so the select stays in sync. */
export const CANDIDATE_SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'fullName:asc', label: 'Name (A–Z)' },
  { value: 'fullName:desc', label: 'Name (Z–A)' },
  { value: 'experience:desc', label: 'Most experienced' },
  { value: 'experience:asc', label: 'Least experienced' },
  { value: 'status:asc', label: 'Status (A–Z)' },
  { value: 'status:desc', label: 'Status (Z–A)' },
];

/** Columns that sort A→Z first; numbers and dates start with the largest/newest. */
export const ASCENDING_FIRST_SORT_KEYS = ['fullName', 'status'];

export const candidateResumePath = (id) => `/candidates/${id}/resume`;

/** "1 yr" / "3.5 yrs" */
export const formatExperience = (years) => {
  const value = Number(years) || 0;
  return `${value} ${value === 1 ? 'yr' : 'yrs'}`;
};
