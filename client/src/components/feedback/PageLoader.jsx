import { cn } from '@/lib/cn';
import Spinner from '@/components/ui/Spinner';

/** Centered spinner for lazy-route Suspense fallbacks and full-page loading. */
export default function PageLoader({ label = 'Loading page', fullScreen = false, className }) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center text-primary-600',
        fullScreen ? 'min-h-screen' : 'min-h-[50vh]',
        className,
      )}
    >
      <Spinner size="lg" label={label} />
    </div>
  );
}
