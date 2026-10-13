import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COLOR_CLASSES, getStatusColor } from '@/lib/colors';
import DropdownMenu from '@/components/ui/DropdownMenu';
import Spinner from '@/components/ui/Spinner';

/** Keeps menu text aligned for the options that are not the current one. */
function Blank() {
  return <span aria-hidden="true" className="inline-block h-4 w-4" />;
}

/**
 * A soft pill showing the current value (status or role) that opens a small menu to change it.
 * Much lighter than an inline select inside a table row.
 *
 * @param {string} value current value
 * @param {string[]} options selectable values
 * @param {(value: string) => void} onChange called only when a different value is chosen
 * @param {string} label accessible name, e.g. "Status of Jane"
 * @param {string} [menuTitle] small heading inside the menu
 * @param {boolean} [colored] tint the pill by status (off for roles)
 * @param {boolean} [loading] save in flight
 */
export default function PillMenu({ value, options, onChange, label, menuTitle, colored = true, loading = false }) {
  const palette = COLOR_CLASSES[colored ? getStatusColor(value) : 'gray'];
  const all = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <DropdownMenu
      label={`${label}: ${value || 'not set'}. Click to change`}
      align="start"
      triggerClassName="rounded-full! bg-transparent! text-inherit! hover:bg-transparent! max-w-full"
      header={menuTitle ? <p className="text-xs font-semibold text-slate-500">{menuTitle}</p> : undefined}
      trigger={
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2.5 pr-2 text-xs font-medium ring-1 ring-inset transition-shadow hover:ring-2',
            palette.badge,
            loading && 'opacity-70',
          )}
        >
          {loading ? (
            <Spinner size="xs" label="Saving" />
          ) : (
            colored && <span className={cn('h-1.5 w-1.5 rounded-full', palette.dot)} />
          )}
          {value || 'Not set'}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </span>
      }
      items={all.map((option) => ({
        label: option,
        icon: option === value ? Check : Blank,
        disabled: loading,
        onClick: () => {
          if (option !== value) onChange(option);
        },
      }))}
    />
  );
}
