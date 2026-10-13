import { cn } from '@/lib/cn';
import { COLOR_CLASSES, getHashColor } from '@/lib/colors';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/** Initials avatar with a stable color derived from the name. */
export default function Avatar({ name, size = 'md', className }) {
  const palette = COLOR_CLASSES[getHashColor(name)];
  return (
    <span
      aria-hidden="true"
      title={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        SIZES[size],
        palette.soft,
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
