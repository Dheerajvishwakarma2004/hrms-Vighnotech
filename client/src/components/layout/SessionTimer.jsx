import { Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectExpiresAt } from '@/features/auth/authSlice';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/cn';
import { formatCountdown, formatDateTime } from '@/lib/date';

const WARNING_MS = 10 * 60 * 1000;
const CRITICAL_MS = 2 * 60 * 1000;

/** Live countdown of the remaining JWT session time (isolated so only this chip re-renders every second). */
export default function SessionTimer({ className }) {
  const expiresAt = useSelector(selectExpiresAt);
  const remaining = useCountdown(expiresAt);

  if (!expiresAt) return null;

  const tone =
    remaining <= CRITICAL_MS
      ? 'bg-rose-50 text-rose-700 ring-rose-600/15'
      : remaining <= WARNING_MS
        ? 'bg-amber-50 text-amber-800 ring-amber-600/20'
        : 'bg-slate-100/80 text-slate-600 ring-slate-500/10';

  return (
    <span
      title={`Session expires at ${formatDateTime(expiresAt, 'hh:mm a')}`}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium tabular-nums ring-1 ring-inset',
        tone,
        className,
      )}
    >
      <Clock aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Session:</span>
      <span>{formatCountdown(remaining)}</span>
      <span className="sr-only">remaining before automatic logout</span>
    </span>
  );
}
