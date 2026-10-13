import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Friendly "nothing here" block: a soft icon badge, a plain title, and a hint about what to do next.
 * @param {import('react').ComponentType} [icon] lucide icon
 * @param {import('react').ReactNode} [action] e.g. a Button to create the first item / clear filters
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  compact = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-3 px-4 py-10' : 'gap-4 px-6 py-16',
        className,
      )}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50/80" aria-hidden="true">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 shadow-sm">
          <Icon className="h-7 w-7" />
        </span>
      </span>
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
