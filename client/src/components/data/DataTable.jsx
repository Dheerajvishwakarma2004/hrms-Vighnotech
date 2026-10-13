import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useElementWidth } from '@/hooks/useElementWidth';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/feedback/ErrorState';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

/** Default width (px) the table needs; narrower containers get the card layout. */
const DEFAULT_TABLE_MIN_WIDTH = 720;

/** Card label/value grid: more columns as the container grows (full class strings for Tailwind). */
function cardGridClass(width) {
  if (width >= 640) return 'grid-cols-4';
  if (width >= 440) return 'grid-cols-3';
  return 'grid-cols-2';
}

function getRowKey(row, index, rowKey) {
  if (typeof rowKey === 'function') return rowKey(row, index);
  return row?.[rowKey] ?? index;
}

function renderCell(column, row, index) {
  if (column.render) return column.render(row, index);
  const value = row?.[column.key];
  return value === undefined || value === null || value === '' ? <span className="text-slate-400">—</span> : value;
}

function SortIndicator({ active, order }) {
  if (!active) return <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />;
  const Icon = order === 'asc' ? ArrowUp : ArrowDown;
  return <Icon aria-hidden="true" className="h-3.5 w-3.5 text-primary-600" />;
}

/**
 * Responsive data table. The layout follows the width of the table's own container (not the viewport),
 * so it adapts to the sidebar and to side-by-side page layouts:
 * - container ≥ `tableMinWidth` → a real <table>; columns with `hideBelow` appear once the container
 *   is at least that wide, and the `actions` column stays pinned to the right edge while scrolling;
 * - narrower → stacked cards: the first column is the card title, the `actions` column is pinned
 *   top-right and the other columns (except `hideInCards`) render as label/value pairs.
 *
 * Column config: `{ key, header, render?(row, index), className?, headerClassName?, mobileLabel?,
 *   hideInCards?, hideBelow?: number (px), align?: 'left'|'center'|'right', sortable?, sortKey? }`.
 *
 * @param {Array} columns
 * @param {Array} data rows
 * @param {string|((row, index) => string)} [rowKey] defaults to `_id`
 * @param {number} [tableMinWidth] container width (px) from which the table layout is used
 * @param {boolean} [loading] first load → skeleton rows
 * @param {boolean} [fetching] background refetch → dims existing rows
 * @param {unknown} [error] shows ErrorState (with `onRetry`) instead of rows
 * @param {{ icon?, title?, description?, action? }} [empty] EmptyState props when there are no rows
 * @param {{ sortBy: string, sortOrder: 'asc'|'desc' }} [sort]
 * @param {(sortKey: string) => void} [onSortChange]
 * @param {(row) => void} [onRowClick]
 */
export default function DataTable({
  columns,
  data = [],
  rowKey = '_id',
  tableMinWidth = DEFAULT_TABLE_MIN_WIDTH,
  loading = false,
  fetching = false,
  error,
  onRetry,
  empty,
  sort,
  onSortChange,
  onRowClick,
  skeletonRows = 5,
  className,
  caption,
}) {
  const [containerRef, width] = useElementWidth();
  const isTable = width >= tableMinWidth;
  const showError = Boolean(error) && !loading;
  const showEmpty = !loading && !showError && data.length === 0;

  const rowProps = (row) =>
    onRowClick
      ? {
          onClick: () => onRowClick(row),
          onKeyDown: (event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onRowClick(row);
            }
          },
          tabIndex: 0,
        }
      : {};

  if (showError) {
    return (
      <div className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-card', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition-opacity',
        fetching && !loading && 'opacity-60',
        className,
      )}
      aria-busy={loading || fetching || undefined}
    >
      {isTable ? (
        <TableLayout
          columns={columns.filter((column) => !column.hideBelow || width >= column.hideBelow)}
          data={data}
          rowKey={rowKey}
          width={width}
          loading={loading}
          skeletonRows={skeletonRows}
          sort={sort}
          onSortChange={onSortChange}
          onRowClick={onRowClick}
          rowProps={rowProps}
          caption={caption}
        />
      ) : (
        <CardLayout
          columns={columns.filter((column) => !column.hideInCards)}
          data={data}
          rowKey={rowKey}
          width={width}
          loading={loading}
          skeletonRows={skeletonRows}
          onRowClick={onRowClick}
          rowProps={rowProps}
        />
      )}

      {showEmpty && <EmptyState compact {...empty} />}
    </div>
  );
}

function TableLayout({
  columns,
  data,
  rowKey,
  width,
  loading,
  skeletonRows,
  sort,
  onSortChange,
  onRowClick,
  rowProps,
  caption,
}) {
  const scrollerRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  // True while columns are hidden behind the right edge — the pinned actions column then casts a shadow.
  const updateOverflow = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setOverflowing(scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 1);
  }, []);

  // Re-measure whenever the container, the rows or the visible columns change.
  useLayoutEffect(() => {
    updateOverflow();
  }, [updateOverflow, width, data, columns]);

  const stickyClass = (column, background) =>
    column.key === 'actions' &&
    cn('sticky right-0 z-[1]', background, overflowing && 'shadow-[-8px_0_8px_-8px_rgb(15_23_42/0.25)]');

  return (
    // `relative` makes the scroller the containing block of absolutely positioned descendants (sr-only
    // labels), so they cannot stretch the page beyond the viewport.
    <div ref={scrollerRef} onScroll={updateOverflow} className="relative overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((column) => {
              const sortKey = column.sortKey ?? column.key;
              const active = sort?.sortBy === sortKey;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-slate-500',
                    ALIGN[column.align ?? 'left'],
                    stickyClass(column, 'bg-slate-50'),
                    column.headerClassName,
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(sortKey)}
                      className="inline-flex items-center gap-1 rounded font-semibold hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {column.header}
                      <SortIndicator active={active} order={sort?.sortOrder} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading &&
            Array.from({ length: skeletonRows }, (_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {columns.map((column, columnIndex) => (
                  <td key={column.key} className="px-4 py-3.5">
                    <Skeleton className={cn('h-4', columnIndex === 0 ? 'w-40' : 'w-20')} />
                  </td>
                ))}
              </tr>
            ))}
          {!loading &&
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index, rowKey)}
                className={cn(
                  'group transition-colors hover:bg-slate-50',
                  onRowClick && 'cursor-pointer focus-visible:bg-primary-50/50 focus-visible:outline-none',
                )}
                {...rowProps(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3.5 text-slate-700',
                      ALIGN[column.align ?? 'left'],
                      stickyClass(column, 'bg-white transition-colors group-hover:bg-slate-50'),
                      column.className,
                    )}
                  >
                    {renderCell(column, row, index)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function CardLayout({ columns, data, rowKey, width, loading, skeletonRows, onRowClick, rowProps }) {
  const [titleColumn, ...restColumns] = columns.filter((column) => column.key !== 'actions');
  const actionsColumn = columns.find((column) => column.key === 'actions');
  const gridClass = cardGridClass(width);

  return (
    <ul className="divide-y divide-slate-100">
      {loading &&
        Array.from({ length: Math.min(skeletonRows, 4) }, (_, index) => (
          <li key={`skeleton-${index}`} className="space-y-3 p-4">
            <Skeleton className="h-4 w-1/2" />
            <div className={cn('grid gap-3', gridClass)}>
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </li>
        ))}
      {!loading &&
        data.map((row, index) => (
          <li
            key={getRowKey(row, index, rowKey)}
            className={cn(
              'p-4 sm:p-5',
              onRowClick &&
                'cursor-pointer active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
            )}
            {...rowProps(row)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{titleColumn && renderCell(titleColumn, row, index)}</div>
              {actionsColumn && <div className="-mr-1 -mt-1 shrink-0">{renderCell(actionsColumn, row, index)}</div>}
            </div>
            {restColumns.length > 0 && (
              <dl className={cn('mt-3.5 grid gap-x-4 gap-y-3', gridClass)}>
                {restColumns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">
                      {column.mobileLabel ?? column.header}
                    </dt>
                    <dd className="mt-0.5 break-words text-sm text-slate-700">{renderCell(column, row, index)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
    </ul>
  );
}
