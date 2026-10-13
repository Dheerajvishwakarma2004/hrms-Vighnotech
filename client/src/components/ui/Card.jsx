import { cn } from '@/lib/cn';

/** White rounded surface. Add padding via className (e.g. "p-4 sm:p-6") or use CardHeader/CardBody. */
export default function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-card', className)} {...props}>
      {children}
    </Component>
  );
}

/** Card title row with optional subtitle and right-aligned actions. */
export function CardHeader({ title, subtitle, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-slate-900 sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4 sm:p-6', className)}>{children}</div>;
}
