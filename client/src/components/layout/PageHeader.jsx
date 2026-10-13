import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * Page title row: a title, a one-line plain-English description, and the main action(s).
 * On phones the actions sit under the text and stretch to a comfortable full-width tap target.
 * @param {import('react').ReactNode} title
 * @param {import('react').ReactNode} [subtitle]
 * @param {import('react').ReactNode} [actions] buttons aligned right
 * @param {{ to: string, label: string }} [back] back link shown above the title
 */
export default function PageHeader({ title, subtitle, actions, back, className }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8', className)}>
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-medium text-slate-500 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {back.label}
          </Link>
        )}
        <h2 className="text-2xl font-bold text-slate-900 sm:text-[1.75rem] sm:leading-9">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-[15px]">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:flex-1 sm:justify-end">{actions}</div>
      )}
    </div>
  );
}
