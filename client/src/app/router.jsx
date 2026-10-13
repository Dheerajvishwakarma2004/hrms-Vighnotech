import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import PageLoader from '@/components/feedback/PageLoader';
import PublicOnlyRoute from '@/components/routing/PublicOnlyRoute';
import RouteErrorBoundary from '@/components/routing/RouteErrorBoundary';
import { ROUTES } from '@/lib/constants';
import NotFoundPage from '@/pages/NotFoundPage';

// Route-level code splitting: each page is its own chunk, rendered inside the layouts' <Suspense>.
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const CandidatesPage = lazy(() => import('@/features/candidates/pages/CandidatesPage'));
const EmployeesPage = lazy(() => import('@/features/employees/pages/EmployeesPage'));
const EmployeeDetailsPage = lazy(() => import('@/features/employees/pages/EmployeeDetailsPage'));
const AttendancePage = lazy(() => import('@/features/attendance/pages/AttendancePage'));
const LeavesPage = lazy(() => import('@/features/leaves/pages/LeavesPage'));

export const router = createBrowserRouter(
  [
    {
      errorElement: <RouteErrorBoundary />,
      hydrateFallbackElement: <PageLoader fullScreen />,
      children: [
        {
          element: <PublicOnlyRoute />,
          children: [
            {
              element: <AuthLayout />,
              children: [
                { path: ROUTES.login, element: <LoginPage />, handle: { title: 'Sign in' } },
                { path: ROUTES.register, element: <RegisterPage />, handle: { title: 'Create account' } },
              ],
            },
          ],
        },
        {
          element: <ProtectedRoute />,
          children: [
            {
              element: <AppLayout />,
              children: [
                {
                  // Page errors render inside the app shell so navigation stays usable.
                  errorElement: <RouteErrorBoundary />,
                  children: [
                    { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
                    { path: ROUTES.dashboard, element: <DashboardPage />, handle: { title: 'Dashboard' } },
                    { path: ROUTES.candidates, element: <CandidatesPage />, handle: { title: 'Candidates' } },
                    { path: ROUTES.employees, element: <EmployeesPage />, handle: { title: 'Employees' } },
                    {
                      path: `${ROUTES.employees}/:id`,
                      element: <EmployeeDetailsPage />,
                      handle: { title: 'Employee details' },
                    },
                    { path: ROUTES.attendance, element: <AttendancePage />, handle: { title: 'Attendance' } },
                    { path: ROUTES.leaves, element: <LeavesPage />, handle: { title: 'Leaves' } },
                  ],
                },
              ],
            },
          ],
        },
        { path: '*', element: <NotFoundPage />, handle: { title: 'Page not found' } },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
