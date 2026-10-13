import { Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COMPANY_NAME } from '@/lib/constants';

/** App mark + wordmark. `inverted` for dark backgrounds. */
export default function BrandLogo({ inverted = false, className }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          inverted ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-primary-600 text-white shadow-sm',
        )}
      >
        <Users aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className={cn('block font-display text-base font-bold', inverted ? 'text-white' : 'text-slate-900')}>
          HRMS
        </span>
        <span className={cn('block text-xs', inverted ? 'text-primary-100' : 'text-slate-500')}>by {COMPANY_NAME}</span>
      </span>
    </span>
  );
}
