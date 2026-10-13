import { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { closeSidebar } from '@/app/uiSlice';
import { useGetMeQuery } from '@/features/auth/authApi';
import { selectToken } from '@/features/auth/authSlice';
import { useRouteTitle } from '@/hooks/useRouteTitle';
import PageLoader from '@/components/feedback/PageLoader';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/** Authenticated shell: sidebar + topbar + lazily loaded page content. */
export default function AppLayout() {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const { pathname } = useLocation();
  const title = useRouteTitle();

  // Re-validates a persisted session with the server and refreshes the user profile.
  useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    dispatch(closeSidebar());
    window.scrollTo({ top: 0 });
  }, [pathname, dispatch]);

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-popover"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Topbar title={title} />
        <main id="main-content" className="mx-auto w-full min-w-0 max-w-[96rem] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
