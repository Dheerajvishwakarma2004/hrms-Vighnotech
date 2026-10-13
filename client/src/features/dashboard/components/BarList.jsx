import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { toPercent } from '../utils/chart';
import { formatCount } from '@/lib/format';

/**
 * Horizontal bar chart as a list of links: label · bar (scaled to the largest value) · value.
 * Bars grow from a shared hairline baseline with a rounded data end; each row opens the filtered list.
 * @param {{ key: string, label: string, value: number, to: string, barClassName?: string, dotClassName?: string }[]} items
 * @param {number} [total] used for the "% of total" in each row's tooltip / accessible label
 */
export default function BarList({ items, total, label, barClassName = 'bg-primary-500' }) {
  const max = Math.max(0, ...items.map((item) => item.value));
  const sum = total ?? items.reduce((acc, item) => acc + item.value, 0);

  return (
    <ul aria-label={label} className="-mx-2 space-y-0.5">
      {items.map((item) => {
        const description = `${item.label}: ${formatCount(item.value)} (${toPercent(item.value, sum)}%)`;
        return (
          <li key={item.key}>
            <Link
              to={item.to}
              title={description}
              aria-label={description}
              className="group grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_2.75rem] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-600 group-hover:text-slate-900">
                {item.dotClassName && (
                  <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', item.dotClassName)} />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <span aria-hidden="true" className="flex h-5 items-center border-l border-slate-200">
                <span
                  className={cn('h-3 rounded-r-md transition-[width] duration-500', item.barClassName ?? barClassName)}
                  style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%`, minWidth: item.value > 0 ? 4 : 0 }}
                />
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatCount(item.value)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
