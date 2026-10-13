import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDisclosure } from '@/hooks/useDisclosure';
import Button from '@/components/ui/Button';

/**
 * Responsive filter toolbar.
 * - Row 1: search (grows), optional `extra` controls (e.g. a sort select) and the Reset button.
 * - Row 2: filter controls in an even grid that fits as many ~10.5rem columns as the width allows
 *   (a control can span two columns with `min-[400px]:col-span-2`).
 * On phones the filter grid collapses behind a "Filters" toggle that shows the active count.
 *
 * @param {import('react').ReactNode} [search] usually a <SearchInput />
 * @param {import('react').ReactNode} [children] filter controls (FilterSelect, date inputs, ...)
 * @param {number} [activeCount] number of active (non-default) filters — enables the reset button
 * @param {() => void} [onReset]
 * @param {import('react').ReactNode} [extra] controls shown next to the search (e.g. sort)
 */
export default function FilterBar({ search, children, activeCount = 0, onReset, extra, className }) {
  const { isOpen, toggle } = useDisclosure(false);
  const hasFilters = Boolean(children);

  return (
    <div className={cn('space-y-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-card sm:p-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-56">{search}</div>
        {hasFilters && (
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={toggle}
            aria-expanded={isOpen}
            aria-label={activeCount > 0 ? `Filters (${activeCount} active)` : 'Filters'}
            className="sm:hidden"
            iconOnly={activeCount === 0}
          >
            {activeCount > 0 ? `${activeCount}` : 'Filters'}
          </Button>
        )}
        {(onReset || extra) && (
          <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end [&>*:only-child]:ml-auto">
            {extra}
            {onReset && (
              <Button variant="ghost" icon={RotateCcw} onClick={onReset} disabled={activeCount === 0}>
                Reset
              </Button>
            )}
          </div>
        )}
      </div>

      {hasFilters && (
        <div
          className={cn(
            'grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]',
            isOpen ? 'grid' : 'hidden',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
