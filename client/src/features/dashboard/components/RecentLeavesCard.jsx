import { CalendarClock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/constants';
import { formatDateRange } from '@/lib/date';
import { pluralize } from '@/lib/format';
import { withQuery } from '@/lib/query';
import DashboardSection from './DashboardSection';
import PersonListItem, { PersonList } from './PersonListItem';

/** Latest leave requests; each row opens the leave list searched by the employee's email. */
export default function RecentLeavesCard({ leaves }) {
  return (
    <DashboardSection
      title="Recent leave requests"
      subtitle="The newest time-off requests from your team"
      link={{ to: ROUTES.leaves }}
      flush
    >
      {leaves.length > 0 ? (
        <PersonList label="Recent leave requests">
          {leaves.map((leave) => (
            <PersonListItem
              key={leave._id}
              name={leave.employee?.fullName ?? 'Unknown employee'}
              subtitle={`${leave.leaveType} · ${formatDateRange(leave.startDate, leave.endDate)}`}
              to={withQuery(ROUTES.leaves, { search: leave.employee?.email })}
              trailing={
                <>
                  <StatusBadge status={leave.status} />
                  <span className="whitespace-nowrap text-xs text-slate-500">{pluralize(leave.days ?? 0, 'day')}</span>
                </>
              }
            />
          ))}
        </PersonList>
      ) : (
        <EmptyState
          compact
          icon={CalendarClock}
          title="No leave requests yet"
          description="When someone asks for time off, it will show up here."
        />
      )}
    </DashboardSection>
  );
}
