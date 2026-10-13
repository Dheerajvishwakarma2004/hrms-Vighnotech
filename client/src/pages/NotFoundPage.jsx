import { ArrowLeft, Compass } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useRouteTitle } from '@/hooks/useRouteTitle';
import { ROUTES } from '@/lib/constants';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  useRouteTitle();

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-8 ring-primary-50/60">
        <Compass aria-hidden="true" className="h-7 w-7" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary-600">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 sm:text-base">
        We couldn&apos;t find that page. It may have been moved, or the link might be mistyped.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Link
          to={isAuthenticated ? ROUTES.dashboard : ROUTES.login}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-semibold sm:h-10 sm:rounded-lg text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {isAuthenticated ? 'Go to dashboard' : 'Go to login'}
        </Link>
      </div>
    </main>
  );
}
