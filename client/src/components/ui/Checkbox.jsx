import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/** Checkbox with optional label + description. Compatible with `register`. */
const Checkbox = forwardRef(function Checkbox({ id, label, description, className, ...props }, ref) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 accent-primary-600 focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed"
        {...props}
      />
      {(label || description) && (
        <span className="text-sm">
          {label && <span className="font-medium text-slate-800">{label}</span>}
          {description && <span className="block text-slate-500">{description}</span>}
        </span>
      )}
    </label>
  );
});

export default Checkbox;
