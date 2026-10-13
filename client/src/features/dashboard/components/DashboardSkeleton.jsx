import Card from '@/components/ui/Card';
import Skeleton, { SkeletonText } from '@/components/ui/Skeleton';

function StatTileSkeleton() {
  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </Card>
  );
}

function SectionSkeleton({ rows = 5 }) {
  return (
    <Card>
      <div className="space-y-2 border-b border-slate-100 px-4 py-4 sm:px-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <SkeletonText lines={2} className="flex-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Mirrors the dashboard grid so the layout doesn't jump when data arrives. */
export default function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatTileSkeleton key={index} />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, row) => (
        <div key={row} className="grid gap-6 md:grid-cols-2">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      ))}
    </div>
  );
}
