import Card, { CardBody } from '@/components/ui/Card';
import Skeleton, { SkeletonText } from '@/components/ui/Skeleton';

/** Placeholder matching the employee details layout while the summary loads. */
export default function EmployeeDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading employee details">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <SkeletonText lines={6} className="mt-6" />
        </Card>
        <div className="space-y-6 lg:col-span-2">
          {[0, 1].map((card) => (
            <Card key={card}>
              <CardBody className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-16" />
                  ))}
                </div>
                <SkeletonText lines={3} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
