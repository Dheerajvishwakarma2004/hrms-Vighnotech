import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  info: { icon: Info, className: 'border-sky-200/80 bg-sky-50 text-sky-900' },
  success: { icon: CheckCircle2, className: 'border-emerald-200/80 bg-emerald-50 text-emerald-900' },
  warning: { icon: AlertTriangle, className: 'border-amber-200/80 bg-amber-50 text-amber-900' },
  error: { icon: AlertCircle, className: 'border-rose-200/80 bg-rose-50 text-rose-900' },
};

/** Inline message banner. `onDismiss` renders a close button. */
export default function Alert({ variant = 'info', title, children, onDismiss, className }) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant] ?? VARIANTS.info;
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border px-4 py-3.5 text-sm', variantClass, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 h-6 w-6 shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
