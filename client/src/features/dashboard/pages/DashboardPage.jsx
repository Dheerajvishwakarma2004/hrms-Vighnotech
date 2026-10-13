import { RefreshCw } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorState from '@/components/feedback/ErrorState';
import { cn } from '@/lib/cn';
import { todayKey } from '@/lib/date';
import { getErrorMessage } from '@/lib/errors';
import { useGetDashboardStatsQuery } from '../dashboardApi';
import AttendanceOverviewCard from '../components/AttendanceOverviewCard';
import CandidatePipelineCard from '../components/CandidatePipelineCard';
import DashboardGreeting from '../components/DashboardGreeting';
import DashboardSkeleton from '../components/DashboardSkeleton';
import DepartmentHeadcountCard from '../components/DepartmentHeadcountCard';
import KpiGrid from '../components/KpiGrid';
import OnLeaveTodayCard from '../components/OnLeaveTodayCard';
import RecentCandidatesCard from '../components/RecentCandidatesCard';
import RecentLeavesCard from '../components/RecentLeavesCard';

/**
 * Cached stats are reused when navigating back within this window; mutations elsewhere
 * invalidate the 'Dashboard' tag, so this only guards against changes made in other sessions.
 */
const STALE_AFTER_SECONDS = 60;

export default function DashboardPage() {
  // Local calendar day — re-evaluated each render so the query rolls over at midnight.
  const date = todayKey();
  const { data, error, isLoading, isFetching, isError, refetch } = useGetDashboardStatsQuery(date, {
    refetchOnMountOrArgChange: STALE_AFTER_SECONDS,
  });
  const isRefreshing = isFetching && !isLoading;

  const renderContent = () => {
    if (isLoading) return <DashboardSkeleton />;

    if (!data) {
      return (
        <Card>
          <ErrorState
            title="We couldn't load your dashboard"
            error={error}
            onRetry={refetch}
            retrying={isFetching}
          />
        </Card>
      );
    }

    return (
      <div aria-busy={isRefreshing} className={cn('space-y-6 transition-opacity', isRefreshing && 'opacity-60')}>
        {isError && (
          <Alert variant="error" title="We couldn't refresh the numbers">
            {getErrorMessage(error)} The figures below are from a moment ago.
          </Alert>
        )}

        <KpiGrid stats={data} date={date} />

        <div className="grid gap-6 md:grid-cols-2">
          <AttendanceOverviewCard attendance={data.attendance} activeEmployees={data.employees.active} date={date} />
          <OnLeaveTodayCard leaves={data.leaves} date={date} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <CandidatePipelineCard candidates={data.candidates} />
          <DepartmentHeadcountCard employees={data.employees} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentCandidatesCard candidates={data.recentCandidates} />
          <RecentLeavesCard leaves={data.recentLeaves} />
        </div>
      </div>
    );
  };

  return (
    <>
      <DashboardGreeting
        pendingLeaves={data?.leaves?.pending}
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} loading={isRefreshing} onClick={refetch}>
            Refresh
          </Button>
        }
      />
      {renderContent()}
    </>
  );
}
