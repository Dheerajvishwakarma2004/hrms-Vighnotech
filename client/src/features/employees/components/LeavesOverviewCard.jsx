import { CalendarDays, Paperclip } from 'lucide-react';
import { formatDateRange } from '@/lib/date';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';

const pluralDays = (count) => `${count} ${count === 1 ? 'day' : 'days'}`;

/**
 * Latest leave requests and the approved-days total for the current year.
 * @param {(leave) => void} onDownloadDocument
 * @param {(leave) => boolean} isDownloadingDocument
 */
export default function LeavesOverviewCard({ leaves, onDownloadDocument, isDownloadingDocument }) {
  const recent = leaves?.recent ?? [];
  const approvedDays = leaves?.approvedDays ?? 0;

  return (
    <Card>
      <CardHeader
        title="Leaves"
        subtitle="Most recent requests"
        actions={
          <Badge color="green" size="md">
            {pluralDays(approvedDays)} approved in {new Date().getFullYear()}
          </Badge>
        }
      />
      <CardBody>
        {recent.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarDays}
            title="No leave requests yet"
            description="Leave requests created on the Leaves page will appear here."
          />
        ) : (
          <ul className="-my-2.5 divide-y divide-slate-100">
            {recent.map((leave) => (
              <li key={leave._id} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-slate-800">{leave.leaveType} leave</span>
                    <StatusBadge status={leave.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatDateRange(leave.startDate, leave.endDate)} · {pluralDays(leave.days)}
                  </p>
                  {leave.reason && (
                    <p className="mt-1 line-clamp-2 break-words text-sm text-slate-600">{leave.reason}</p>
                  )}
                </div>
                {leave.document && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Paperclip}
                    iconOnly
                    loading={isDownloadingDocument(leave)}
                    onClick={() => onDownloadDocument(leave)}
                    title={`Download ${leave.document.filename}`}
                  >
                    Download document
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
