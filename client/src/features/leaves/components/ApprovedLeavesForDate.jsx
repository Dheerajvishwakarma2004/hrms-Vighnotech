import { CalendarHeart } from "lucide-react";
import EmployeeIdentity from "@/components/data/EmployeeIdentity";
import ErrorState from "@/components/feedback/ErrorState";
import Badge from "@/components/ui/Badge";
import Card, { CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { formatDate, formatDateRange } from "@/lib/date";
import LeaveDocumentButton from "./LeaveDocumentButton";
import LeaveTypeBadge from "./LeaveTypeBadge";
import { pluralize } from "@/lib/format";

const getSubtitle = (count) =>
  count === 0
    ? "Nobody is on leave"
    : `${pluralize(count, "employee")} on leave`;

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-slate-100">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Approved leaves on <date>" list shown beneath the calendar.
 * @param {string} dateKey selected day (`YYYY-MM-DD`)
 * @param {Array} leaves approved leaves covering that day
 * @param {{ download: Function, isDownloading: Function }} downloader `useDownload()` result
 */
export default function ApprovedLeavesForDate({
  dateKey,
  isToday,
  leaves,
  loading,
  error,
  onRetry,
  downloader,
}) {
  const count = leaves.length;

  return (
    <Card as="section" aria-label={`Approved leaves on ${formatDate(dateKey)}`}>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            Who is on leave · {formatDate(dateKey, "EEE, d MMM")}
            {isToday && (
              <Badge color="primary" dot>
                Today
              </Badge>
            )}
          </span>
        }
        subtitle={loading || error ? undefined : getSubtitle(count)}
      />

      {loading && <ListSkeleton />}
      {!loading && error && (
        <ErrorState compact error={error} onRetry={onRetry} />
      )}
      {!loading && !error && count === 0 && (
        <EmptyState
          compact
          icon={CalendarHeart}
          title="Nobody is on leave on this day"
          description="Everyone is available. Pick another day in the calendar to check."
        />
      )}
      {!loading && !error && count > 0 && (
        <ul className="divide-y divide-slate-100" aria-live="polite">
          {leaves.map((leave) => (
            <li
              key={leave._id}
              className="flex items-start gap-3 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <EmployeeIdentity
                  employee={leave.employee}
                  linked
                  subtitle={[
                    leave.employee?.department,
                    leave.employee?.position,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-11 text-xs text-slate-500">
                  <LeaveTypeBadge type={leave.leaveType} />
                  <span className="whitespace-nowrap">
                    {formatDateRange(leave.startDate, leave.endDate)}
                    {leave.days ? ` · ${pluralize(leave.days, "day")}` : ""}
                  </span>
                </div>
              </div>
              {leave.document && (
                <div className="shrink-0">
                  <LeaveDocumentButton leave={leave} downloader={downloader} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
