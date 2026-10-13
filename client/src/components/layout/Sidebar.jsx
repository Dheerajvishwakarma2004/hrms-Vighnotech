import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { closeSidebar, selectSidebarOpen } from '@/app/uiSlice';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { BREAKPOINTS, useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from '@/lib/constants';
import Avatar from '@/components/ui/Avatar';
import { lockBodyScroll } from '@/components/ui/overlay';
import BrandLogo from './BrandLogo';

/** Fixed sidebar on `lg+`; off-canvas drawer with overlay below `lg` (state in the `ui` slice). */
export default function Sidebar() {
  const dispatch = useDispatch();
  const open = useSelector(selectSidebarOpen);
  const user = useSelector(selectCurrentUser);
  const isDesktop = useMediaQuery(BREAKPOINTS.lg);
  const closeButtonRef = useRef(null);
  const isDrawerOpen = open && !isDesktop;

  useEffect(() => {
    if (isDesktop && open) dispatch(closeSidebar());
  }, [isDesktop, open, dispatch]);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const unlockScroll = lockBodyScroll();
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dispatch(closeSidebar());
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      unlockScroll();
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isDrawerOpen, dispatch]);

  return (
    <>
      {isDrawerOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 animate-fade-in bg-slate-900/40 lg:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        role={isDrawerOpen ? 'dialog' : undefined}
        aria-modal={isDrawerOpen || undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200/70 bg-white transition-[transform,visibility] duration-200 ease-out lg:z-30 lg:w-64 lg:translate-x-0',
          open ? 'translate-x-0 shadow-popover' : '-translate-x-full lg:shadow-none',
          !open && !isDesktop && 'invisible lg:visible',
        )}
      >
        <div className="flex h-[4.5rem] shrink-0 items-center justify-between px-5">
          <BrandLogo />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => dispatch(closeSidebar())}
            className="rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Pages" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                      isActive
                        ? 'bg-primary-50 font-semibold text-primary-800'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="m-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <Avatar name={user.fullName} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{user.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user.role ?? 'HR'} · {user.email}</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
