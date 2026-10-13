import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import Button from './Button';

/** Page numbers with ellipses, e.g. [1, '…', 4, 5, 6, '…', 12]. */
function getPageItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const items = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push('start-ellipsis');
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < totalPages - 1) items.push('end-ellipsis');
  items.push(totalPages);
  return items;
}

/**
 * Pagination footer: "Showing x–y of z", page size select, prev/next + page numbers (numbers on sm+).
 * Pass the server `meta` fields directly: `<Pagination {...meta} onPageChange onLimitChange />`.
 */
export default function Pagination({
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  disabled = false,
  className,
}) {
  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = Math.max(1, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-600 sm:justify-start">
        <p aria-live="polite">
          Showing <span className="font-medium text-slate-900">{from}</span>–
          <span className="font-medium text-slate-900">{to}</span> of{' '}
          <span className="font-medium text-slate-900">{total}</span>
        </p>
        {onLimitChange && (
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Rows</span>
            <select
              value={limit}
              disabled={disabled}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>

        <span className="px-2 text-sm text-slate-600 sm:hidden">
          Page {page} of {pages}
        </span>

        <ul className="hidden items-center gap-1 sm:flex">
          {getPageItems(page, pages).map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => item !== page && onPageChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'h-9 min-w-[2.25rem] rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    item === page ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {item}
                </button>
              </li>
            ) : (
              <li key={item} aria-hidden="true" className="px-1 text-slate-400">
                …
              </li>
            ),
          )}
        </ul>

        <Button
          variant="secondary"
          size="sm"
          rightIcon={ChevronRight}
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
