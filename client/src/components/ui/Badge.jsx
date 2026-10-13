import { cn } from '@/lib/cn';
import { COLOR_CLASSES } from '@/lib/colors';

/**
 * Small pill label.
 * @param {'gray'|'primary'|'blue'|'indigo'|'purple'|'green'|'teal'|'yellow'|'orange'|'red'} [color]
 * @param {boolean} [dot] leading status dot
 * @param {'sm'|'md'} [size]
 */
export default function Badge({ color = 'gray', dot = false, size = 'sm', className, children }) {
  const palette = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray;
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        palette.badge,
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', palette.dot)} />}
      <span className="truncate">{children}</span>
    </span>
  );
}
