import { cn } from '@/lib/cn';
import { COLOR_CLASSES, getStatusColor } from '@/lib/colors';
import Select from './Select';
import Spinner from './Spinner';

/** Keeps the current value selectable even when it is missing from the options (e.g. while they load). */
function withCurrentValue(options, value) {
  return value && !options.includes(value) ? [value, ...options] : options;
}

/**
 * Compact inline select for table rows (statuses, roles). Shows a colored status dot inside the field,
 * replaced by a spinner while the change is being saved.
 *
 * @param {string} value current value ('' shows the `placeholder`)
 * @param {string[]} options values from the meta API
 * @param {(value: string) => void} onChange called only when a different, non-empty value is picked
 * @param {string} label accessible label
 * @param {boolean} [loading] save in flight — disables the field and shows a spinner
 * @param {boolean} [showDot] colored status dot (off for non-status values such as roles)
 * @param {string} [dotStatus] status that colors the dot (defaults to `value`)
 * @param {string} [placeholder] unselectable empty option (e.g. "Not marked")
 */
export default function StatusSelect({
  id,
  value,
  options,
  onChange,
  label,
  loading = false,
  disabled = false,
  showDot = true,
  dotStatus = value,
  placeholder,
  className,
}) {
  const hasIndicator = showDot || loading;

  return (
    <div className={cn('relative w-full', className)}>
      {loading && (
        <Spinner
          size="xs"
          label="Saving"
          className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-primary-600"
        />
      )}
      {showDot && !loading && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full',
            COLOR_CLASSES[getStatusColor(dotStatus)].dot,
          )}
        />
      )}
      <Select
        id={id}
        aria-label={label}
        size="sm"
        value={value}
        options={withCurrentValue(options, value)}
        placeholder={placeholder}
        placeholderDisabled={placeholder !== undefined}
        disabled={loading || disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (next && next !== value) onChange(next);
        }}
        selectClassName={cn('font-medium', hasIndicator && '!pl-7')}
      />
    </div>
  );
}
