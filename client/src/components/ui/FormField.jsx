import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Label + control + hint + error. Pass the same `id` to the control (Input/Select/...) as `htmlFor` here,
 * and give the control `error={!!error}` / `hasHint={!!hint}` so aria-describedby links up.
 */
export default function FormField({ label, htmlFor, error, hint, required = false, action, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || action) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
              {label}
              {required && (
                <span className="ml-0.5 text-rose-500" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {hint && !error && (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="flex items-start gap-1 text-xs font-medium text-rose-600"
        >
          <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
