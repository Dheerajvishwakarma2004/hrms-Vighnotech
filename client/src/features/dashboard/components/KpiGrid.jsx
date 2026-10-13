import { CalendarClock, UserCheck, UserRoundSearch, Users } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { toPercent } from '../utils/chart';
import { formatCount, pluralize } from '@/lib/format';
import { withQuery } from '@/lib/query';
import StatTile from './StatTile';

/** The four headline numbers, each linking to its (pre-filtered) list page. */
export default function KpiGrid({ stats, date }) {
  const { candidates, employees, attendance, leaves } = stats;
  const present = attendance.byStatus.Present ?? 0;
  const inactive = Math.max(employees.total - employees.active, 0);
  const newCandidates = candidates.byStatus.New ?? 0;
  const scheduled = candidates.byStatus.Scheduled ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Total candidates"
        value={candidates.total}
        icon={UserRoundSearch}
        color="blue"
        description={`${formatCount(newCandidates)} new · ${formatCount(scheduled)} waiting for interview`}
        to={ROUTES.candidates}
      />
      <StatTile
        label="Employees"
        value={employees.total}
        icon={Users}
        color="primary"
        description={`${formatCount(employees.active)} working now · ${formatCount(inactive)} inactive`}
        to={ROUTES.employees}
      />
      <StatTile
        label="Present today"
        value={present}
        icon={UserCheck}
        color="green"
        description={`Attendance marked for ${formatCount(attendance.marked)} of ${formatCount(employees.active)}`}
        progress={Math.min(toPercent(attendance.marked, employees.active), 100)}
        to={withQuery(ROUTES.attendance, { date })}
      />
      <StatTile
        label="Leave requests to review"
        value={leaves.pending}
        icon={CalendarClock}
        color="yellow"
        description={
          leaves.pending > 0
            ? `${pluralize(leaves.upcomingApproved, 'approved leave')} coming up this week`
            : 'All caught up'
        }
        to={withQuery(ROUTES.leaves, { status: 'Pending' })}
      />
    </div>
  );
}
