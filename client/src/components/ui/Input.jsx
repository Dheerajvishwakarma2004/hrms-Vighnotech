import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { describedBy, fieldClassName } from './fieldStyles';

/**
 * Text input compatible with react-hook-form `register`.
 * @param {string|boolean} [error] error message (or flag) — styles the field and sets aria-invalid
 * @param {boolean} [hasHint] set when the surrounding FormField renders a hint
 * @param {import('react').ComponentType} [leftIcon] lucide icon inside the field
 * @param {string} [leftAddon] short text label inside the field, before the value (e.g. "From")
 * @param {import('react').ReactNode} [rightElement] element pinned to the right (e.g. show/hide button)
 */
const Input = forwardRef(function Input(
  {
    id,
    type = 'text',
    error,
    hasHint,
    leftIcon: LeftIcon,
    leftAddon,
    rightElement,
    className,
    inputClassName,
    ...props
  },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      {LeftIcon && (
        <LeftIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
      )}
      {leftAddon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
        >
          {leftAddon}
        </span>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { error, hint: hasHint })}
        className={fieldClassName({
          error,
          className: cn('h-11 px-3 sm:h-10', LeftIcon && 'pl-9', leftAddon && 'pl-12', rightElement && 'pr-10', inputClassName),
        })}
        {...props}
      />
      {rightElement && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{rightElement}</div>}
    </div>
  );
});

export default Input;
