import { ClipboardCheck } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { NOT_MARKED, ROUTES } from '@/lib/constants';
import { formatDate } from '@/lib/date';
import { formatCount } from '@/lib/format';
import { withQuery } from '@/lib/query';
import AttendanceDonut from './AttendanceDonut';
import DashboardSection from './DashboardSection';

/** Today's attendance split by status (+ not yet marked) for active employees. */
export default function AttendanceOverviewCard({ attendance, activeEmployees, date }) {
  const items = [...Object.entries(attendance.byStatus), [NOT_MARKED, attendance.notMarked]].map(([status, count]) => ({
    key: status,
    label: status,
    value: count,
    to: withQuery(ROUTES.attendance, { date, status }),
  }));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const attendanceLink = withQuery(ROUTES.attendance, { date });

  return (
    <DashboardSection
      title="Today's attendance"
      subtitle={formatDate(date, 'EEEE, dd MMM yyyy')}
      link={{ to: attendanceLink, label: 'Manage' }}
      footer={
        total > 0 &&
        attendance.notMarked > 0
          ? `${formatCount(attendance.notMarked)} of ${formatCount(activeEmployees)} people still need attendance marked`
          : 'Everyone has been marked today'
      }
    >
      {total > 0 ? (
        <AttendanceDonut
          label="Attendance by status"
          items={items}
          summary={{ value: `${formatCount(attendance.marked)}/${formatCount(total)}`, label: 'marked' }}
        />
      ) : (
        <EmptyState
          compact
          icon={ClipboardCheck}
          title="No active employees"
          description="Attendance appears here once you have active employees."
        />
      )}
    </DashboardSection>
  );
}
