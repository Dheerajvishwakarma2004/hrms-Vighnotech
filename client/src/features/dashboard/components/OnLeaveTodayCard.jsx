import { CalendarHeart } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/lib/date';
import { pluralize } from '@/lib/format';
import DashboardSection from './DashboardSection';
import PersonListItem, { PersonList } from './PersonListItem';

/** Approved leaves covering the selected date, plus how many approved leaves start in the next week. */
export default function OnLeaveTodayCard({ leaves, date }) {
  const { approvedOnDate, upcomingApproved } = leaves;

  return (
    <DashboardSection
      title="On leave today"
      subtitle={`${pluralize(approvedOnDate.length, 'employee')} on approved leave`}
      link={{ to: ROUTES.leaves, label: 'Leave calendar' }}
      flush
      footer={
        upcomingApproved > 0
          ? `${pluralize(upcomingApproved, 'more leave')} starting in the next 7 days`
          : 'No other leaves are starting this week'
      }
    >
      {approvedOnDate.length > 0 ? (
        <div className="max-h-[22rem] overflow-y-auto">
          <PersonList label="Employees on leave today">
            {approvedOnDate.map((leave) => {
              const endsToday = leave.endDate?.slice(0, 10) === date;
              return (
                <PersonListItem
                  key={leave._id}
                  name={leave.employee?.fullName ?? 'Unknown employee'}
                  subtitle={[leave.employee?.position, leave.employee?.department].filter(Boolean).join(' · ')}
                  to={leave.employee?._id ? ROUTES.employeeDetails(leave.employee._id) : ROUTES.leaves}
                  trailing={
                    <>
                      <Badge color="gray">{leave.leaveType}</Badge>
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {endsToday ? 'Ends today' : `Until ${formatDate(leave.endDate, 'dd MMM')}`}
                      </span>
                    </>
                  }
                />
              );
            })}
          </PersonList>
        </div>
      ) : (
        <EmptyState
          compact
          icon={CalendarHeart}
          title="Everyone is in today"
          description="Nobody is on approved leave today."
        />
      )}
    </DashboardSection>
  );
}
