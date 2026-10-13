import { CalendarCheck, CalendarDays, LayoutDashboard, UserRoundSearch, Users } from 'lucide-react';

export const APP_NAME = 'HRMS Dashboard';
export const COMPANY_NAME = 'VighnoTech';

/** API base URL — `VITE_API_URL` when the client is hosted separately, otherwise the same-origin `/api`. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const AUTH_STORAGE_KEY = 'hrms_auth';

export const SEARCH_DEBOUNCE_MS = 400;
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** Attendance status the API reports (filter value + summary key) for employees without a record that day. */
export const NOT_MARKED = 'Not Marked';

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Accepted upload types — mirrors the server's multer filters. */
export const FILE_TYPES = {
  resume: {
    accept: '.pdf,application/pdf',
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
    description: 'PDF',
  },
  leaveDocument: {
    accept: '.pdf,.png,.jpg,.jpeg,.doc,.docx',
    mimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'],
    description: 'PDF, PNG, JPG, DOC or DOCX',
  },
};

export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  candidates: '/candidates',
  employees: '/employees',
  employeeDetails: (id) => `/employees/${id}`,
  attendance: '/attendance',
  leaves: '/leaves',
};

export const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Candidates', to: ROUTES.candidates, icon: UserRoundSearch },
  { label: 'Employees', to: ROUTES.employees, icon: Users },
  { label: 'Attendance', to: ROUTES.attendance, icon: CalendarCheck },
  { label: 'Leaves', to: ROUTES.leaves, icon: CalendarDays },
];
