import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

export default function Spinner({ size = 'md', className, label = 'Loading' }) {
  return (
    <span role="status" className={cn('inline-flex items-center justify-center', className)}>
      <Loader2 aria-hidden="true" className={cn('animate-spin text-current', SIZES[size])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
