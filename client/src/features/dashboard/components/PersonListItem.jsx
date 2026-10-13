import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';

/**
 * Linked list row: avatar · name + subtitle · trailing content (status badge, date, ...).
 * Render inside a `<ul>`; the trailing column stacks under the text on very narrow screens.
 */
export default function PersonListItem({ name, subtitle, trailing, to }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 sm:px-5"
      >
        <Avatar name={name} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{name}</p>
            {subtitle && <p className="truncate text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
          </div>
          {trailing && (
            <div className="flex shrink-0 items-center gap-2 min-[400px]:flex-col min-[400px]:items-end min-[400px]:gap-1">
              {trailing}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

/** Divided list wrapper for PersonListItem rows. */
export function PersonList({ label, children }) {
  return (
    <ul aria-label={label} className="divide-y divide-slate-100">
      {children}
    </ul>
  );
}
