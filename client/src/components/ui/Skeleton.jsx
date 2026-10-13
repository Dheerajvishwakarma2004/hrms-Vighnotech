import { cn } from '@/lib/cn';

/** Shimmering placeholder block; size it with className (e.g. "h-4 w-32"). */
export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />;
}

/** Several text-line skeletons, the last one shorter. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div aria-hidden="true" className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
