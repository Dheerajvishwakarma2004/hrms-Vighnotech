import { cn } from '@/lib/cn';

/** Shared visual style for text inputs, selects and textareas. */
export function fieldClassName({ error, className } = {}) {
  return cn(
    'block w-full rounded-xl border bg-white text-sm text-slate-900 shadow-sm transition-colors sm:rounded-lg',
    'placeholder:text-slate-400 hover:border-slate-400/80 focus:outline-none focus:ring-4',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
      : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/15',
    className,
  );
}

/** ids used to link a field with its FormField error/hint text (`aria-describedby`). */
export function describedBy(id, { error, hint } = {}) {
  if (!id) return undefined;
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}
