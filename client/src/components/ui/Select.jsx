import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { describedBy, fieldClassName } from './fieldStyles';

function normalizeOption(option) {
  return typeof option === 'object' && option !== null
    ? { value: String(option.value), label: option.label ?? String(option.value), disabled: option.disabled }
    : { value: String(option), label: String(option) };
}

/**
 * Native select (best accessibility + mobile pickers). Works with `register` or as a controlled input.
 * @param {Array<string|number|{value, label, disabled?}>} options
 * @param {string} [placeholder] rendered as the empty-value first option (e.g. "All departments")
 * @param {boolean} [placeholderDisabled] make the placeholder unselectable (required form fields)
 */
const Select = forwardRef(function Select(
  {
    id,
    options = [],
    placeholder,
    placeholderDisabled = false,
    error,
    hasHint,
    size = 'md',
    className,
    selectClassName,
    ...props
  },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { error, hint: hasHint })}
        className={fieldClassName({
          error,
          className: cn(
            'cursor-pointer appearance-none truncate pr-9',
            size === 'sm' ? 'h-10 pl-3 text-sm sm:h-9' : 'h-11 pl-3 sm:h-10',
            selectClassName,
          ),
        })}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled={placeholderDisabled}>
            {placeholder}
          </option>
        )}
        {options.map(normalizeOption).map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
});

export default Select;
