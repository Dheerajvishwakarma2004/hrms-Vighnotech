import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { openSidebar, selectSidebarOpen } from '@/app/uiSlice';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useLogout } from '@/features/auth/hooks/useLogout';
import Avatar from '@/components/ui/Avatar';
import DropdownMenu from '@/components/ui/DropdownMenu';
import { formatDateTime } from '@/lib/date';
import SessionTimer from './SessionTimer';

/** Sticky header: drawer toggle (below lg), current page title, session countdown and user menu. */
export default function Topbar({ title }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const signOut = useLogout();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => dispatch(openSidebar())}
          className="-ml-2 rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
          aria-label="Open navigation"
          aria-controls="app-sidebar"
          aria-expanded={sidebarOpen}
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>

        <h1 className="min-w-0 flex-1 truncate font-display text-base font-semibold text-slate-900 sm:text-lg lg:sr-only">{title}</h1>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-slate-500 lg:block">{formatDateTime(new Date(), 'EEEE, d MMMM yyyy')}</p>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SessionTimer />
          <DropdownMenu
            label="Open user menu"
            triggerClassName="gap-2 rounded-full p-0.5 sm:rounded-xl sm:py-1.5 sm:pl-1.5 sm:pr-2.5"
            trigger={
              <>
                <Avatar name={user?.fullName ?? 'HR'} size="sm" />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-700 md:inline">
                  {user?.fullName}
                </span>
                <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-slate-400 sm:inline" />
              </>
            }
            header={
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <p className="mt-1 text-xs font-medium text-primary-700">{user?.role ?? 'HR'}</p>
              </div>
            }
            items={[{ label: 'Sign out', icon: LogOut, onClick: signOut, danger: true }]}
          />
        </div>
      </div>
    </header>
  );
}
