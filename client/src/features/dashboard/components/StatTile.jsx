import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { COLOR_CLASSES } from '@/lib/colors';
import { formatCount } from '@/lib/format';

/**
 * KPI tile that links to the page (and pre-filtered view) behind the number.
 * @param {import('react').ComponentType} icon lucide icon
 * @param {keyof COLOR_CLASSES} [color] icon accent
 * @param {import('react').ReactNode} [description] secondary line under the value
 * @param {number} [progress] optional 0–100 meter rendered under the description
 */
export default function StatTile({ label, value, icon: Icon, color = 'primary', description, progress, to }) {
  const palette = COLOR_CLASSES[color] ?? COLOR_CLASSES.primary;
  return (
    <Link
      to={to}
      className="group flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', palette.soft)}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-primary-600 group-hover:text-white"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-display font-semibold text-slate-900 sm:text-3xl">{formatCount(value)}</p>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {progress !== undefined && (
        <div
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-1.5 overflow-hidden rounded-full bg-primary-100"
        >
          <div className="h-full rounded-full bg-primary-500 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  );
}
