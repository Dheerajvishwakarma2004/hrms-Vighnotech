import { CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COLOR_CLASSES, getStatusColor } from '@/lib/colors';
import { formatDate, formatDateRange } from '@/lib/date';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';

/** Count of days with one attendance status. */
function StatusCountTile({ label, value }) {
  const palette = COLOR_CLASSES[getStatusColor(label)];
  return (
    <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', palette.dot)} />
        <span className="leading-tight">{label}</span>
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

/** Attendance counts by status for the summary window plus the latest records. */
export default function AttendanceOverviewCard({ attendance }) {
  const counts = Object.entries(attendance?.counts ?? {});
  const recent = attendance?.recent ?? [];
  const markedDays = counts.reduce((total, [, count]) => total + count, 0);

  return (
    <Card>
      <CardHeader
        title="Attendance"
        subtitle={`Last 30 days · ${formatDateRange(attendance?.from, attendance?.to)}`}
        actions={
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{markedDays}</span> marked
          </span>
        }
      />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
          {counts.map(([status, count]) => (
            <StatusCountTile key={status} label={status} value={count} />
          ))}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900">Recent records</h4>
          {recent.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarCheck}
              title="No attendance recorded yet"
              description="Records marked on the Attendance page will appear here."
            />
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recent.map((record) => (
                <li key={record._id} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex items-center justify-between gap-3 sm:w-64 sm:shrink-0">
                    <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                      {formatDate(record.date, 'EEE, dd MMM yyyy')}
                    </span>
                    <StatusBadge status={record.status} />
                  </div>
                  <p
                    className={cn(
                      'min-w-0 flex-1 break-words text-sm',
                      record.task ? 'text-slate-600' : 'italic text-slate-400',
                    )}
                  >
                    {record.task || 'No task noted'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
