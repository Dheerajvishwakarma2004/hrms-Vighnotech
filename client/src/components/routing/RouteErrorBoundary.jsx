import { Home, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import ErrorState from '@/components/feedback/ErrorState';
import NotFoundPage from '@/pages/NotFoundPage';

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed/i;

/** `errorElement` for the router: 404 responses, stale lazy chunks after a deploy, and render crashes. */
export default function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  const isChunkError = error instanceof Error && CHUNK_ERROR_PATTERN.test(error.message);
  if (import.meta.env.DEV && !isChunkError) console.error('Route error:', error);

  const reloadAction = (
    <Button icon={RefreshCw} onClick={() => window.location.reload()}>
      Reload page
    </Button>
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      {isChunkError ? (
        <ErrorState
          title="A new version is available"
          message="This page was updated since you opened the app. Reload to get the latest version."
          action={reloadAction}
        />
      ) : (
        <ErrorState
          title="This page ran into a problem"
          message={
            isRouteErrorResponse(error)
              ? `${error.status} ${error.statusText}`
              : 'An unexpected error occurred while rendering this page.'
          }
          action={
            <>
              {reloadAction}
              <Link
                to={ROUTES.dashboard}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:h-10 sm:rounded-lg"
              >
                <Home aria-hidden="true" className="h-4 w-4" />
                Go to dashboard
              </Link>
            </>
          }
        />
      )}
    </div>
  );
}
