import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500',
  secondary:
    'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400/70 active:bg-slate-100 focus-visible:ring-primary-500',
  soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 focus-visible:ring-primary-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-primary-500',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500',
  'danger-ghost': 'text-rose-600 hover:bg-rose-50 active:bg-rose-100 focus-visible:ring-rose-500',
  link: 'text-primary-600 underline-offset-4 hover:text-primary-700 hover:underline focus-visible:ring-primary-500',
};

const SIZES = {
  xs: 'h-9 gap-1 rounded-lg px-2.5 text-xs sm:h-8',
  sm: 'h-10 gap-1.5 rounded-lg px-3.5 text-sm sm:h-9',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm sm:h-10 sm:rounded-lg',
  lg: 'h-12 gap-2 rounded-xl px-6 text-base',
};

const ICON_ONLY_SIZES = {
  xs: 'h-9 w-9 rounded-lg sm:h-8 sm:w-8',
  sm: 'h-10 w-10 rounded-lg sm:h-9 sm:w-9',
  md: 'h-11 w-11 rounded-xl sm:h-10 sm:w-10 sm:rounded-lg',
  lg: 'h-12 w-12 rounded-xl',
};

const ICON_SIZES = { xs: 'h-3.5 w-3.5', sm: 'h-4 w-4', md: 'h-4 w-4', lg: 'h-5 w-5' };

/**
 * @param {'primary'|'secondary'|'soft'|'ghost'|'danger'|'danger-ghost'|'link'} variant
 * @param {'xs'|'sm'|'md'|'lg'} size
 * @param {import('react').ComponentType} [icon] lucide icon rendered before the label
 * @param {import('react').ComponentType} [rightIcon] lucide icon rendered after the label
 * @param {boolean} [iconOnly] square button — pass `aria-label`
 * @param {boolean} [loading] shows a spinner and disables the button
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    rightIcon: RightIcon,
    iconOnly = false,
    loading = false,
    fullWidth = false,
    disabled,
    type = 'button',
    className,
    children,
    ...props
  },
  ref,
) {
  const iconClass = ICON_SIZES[size];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
        variant === 'link' && 'h-auto px-0',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className={cn('animate-spin', iconClass)} />
      ) : (
        Icon && <Icon aria-hidden="true" className={iconClass} />
      )}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
      {RightIcon && !loading && <RightIcon aria-hidden="true" className={iconClass} />}
    </button>
  );
});

export default Button;
