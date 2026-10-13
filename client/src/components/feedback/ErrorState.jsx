import { AlertOctagon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/errors';
import Button from '@/components/ui/Button';

/**
 * Error block with an optional Retry button.
 * @param {unknown} [error] any error shape — message derived via getErrorMessage
 * @param {string} [message] explicit message (overrides `error`)
 * @param {() => void} [onRetry] usually the RTK Query `refetch`
 * @param {boolean} [retrying] spinner on the retry button
 */
export default function ErrorState({
  title = 'Something went wrong',
  error,
  message,
  onRetry,
  retrying = false,
  compact = false,
  action,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-8 ring-rose-50/60">
        <AlertOctagon aria-hidden="true" className="h-7 w-7" />
      </span>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{message ?? getErrorMessage(error)}</p>
      </div>
      {(onRetry || action) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button variant="secondary" size="sm" icon={RefreshCw} loading={retrying} onClick={() => onRetry()}>
              Try again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
