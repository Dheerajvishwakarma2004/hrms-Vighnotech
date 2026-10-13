import { Suspense } from 'react';
import { CalendarCheck, UserRoundSearch, Users } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useRouteTitle } from '@/hooks/useRouteTitle';
import { COMPANY_NAME } from '@/lib/constants';
import PageLoader from '@/components/feedback/PageLoader';
import BrandLogo from './BrandLogo';

const HIGHLIGHTS = [
  { icon: UserRoundSearch, text: 'Follow every candidate from first interview to hire' },
  { icon: Users, text: 'Keep employee details, roles and departments tidy' },
  { icon: CalendarCheck, text: 'Mark attendance and approve leave in a few clicks' },
];

/** Split-screen layout for /login and /register (brand panel hidden below lg). */
export default function AuthLayout() {
  useRouteTitle();

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-primary-800 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* Soft decorative rings, purely visual. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full border-[3rem] border-white/[0.04]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/[0.04]"
        />
        <BrandLogo inverted />
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
            People work, made simpler.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-primary-100">
            One calm place for your hiring, your team and their time off.
          </p>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4 text-primary-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-200">
          © {new Date().getFullYear()} {COMPANY_NAME}
        </p>
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <BrandLogo className="mb-10 lg:hidden" />
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <Suspense fallback={<PageLoader className="min-h-[24rem]" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
