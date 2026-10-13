import { CalendarX2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ErrorState from "@/components/feedback/ErrorState";
import Badge from "@/components/ui/Badge";
import EmployeeIdentity from "@/components/data/EmployeeIdentity";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { ROUTES } from "@/lib/constants";
import { getStatusColor } from "@/lib/colors";
import { formatDate } from "@/lib/date";
import { useGetEmployeeAttendanceQuery } from "../attendanceApi";
import { getRecentRange } from "../utils/dates";
import { HISTORY_DAYS } from "../constants";

function HistorySkeleton() {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <li
          key={index}
          className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/**
 * One employee's attendance over the last {@link HISTORY_DAYS} days: per-status totals and a day-by-day list.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {{ _id: string, fullName: string, email: string }|null} employee
 * @param {string[]} statuses attendance statuses from the meta options (orders the totals)
 */
export default function AttendanceHistoryModal({
  open,
  onClose,
  employee,
  statuses,
}) {
  const navigate = useNavigate();
  const { from, to } = getRecentRange(HISTORY_DAYS);
  // `currentData` (not `data`) so switching employees never shows the previous employee's records.
  const { currentData, error, isFetching, refetch } =
    useGetEmployeeAttendanceQuery(
      { employeeId: employee?._id, from, to },
      { skip: !open || !employee },
    );
  const records = currentData ?? [];
  const isLoading = isFetching && !currentData;

  const counts = {};
  records.forEach(({ status }) => {
    counts[status] = (counts[status] ?? 0) + 1;
  });
  const countedStatuses = statuses.filter((status) => counts[status]);

  const renderBody = () => {
    if (isLoading) return <HistorySkeleton />;
    if (error)
      return (
        <ErrorState
          compact
          error={error}
          onRetry={refetch}
          retrying={isFetching}
        />
      );
    if (records.length === 0) {
      return (
        <EmptyState
          compact
          icon={CalendarX2}
          title="No attendance recorded"
          description={`Nothing has been marked for this employee in the last ${HISTORY_DAYS} days.`}
        />
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Totals by status">
          {countedStatuses.map((status) => (
            <Badge key={status} color={getStatusColor(status)} dot size="md">
              {status}: {counts[status]}
            </Badge>
          ))}
        </div>
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record._id}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {formatDate(record.date, "EEE, dd MMM yyyy")}
                </p>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm text-slate-500">
                  {record.task || (
                    <span className="italic text-slate-400">
                      No task assigned
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge status={record.status} className="self-start" />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Attendance history"
      description={`Last ${HISTORY_DAYS} days · ${formatDate(from, "dd MMM")} – ${formatDate(to)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {employee && (
            <Button
              icon={UserRound}
              onClick={() => navigate(ROUTES.employeeDetails(employee._id))}
            >
              View profile
            </Button>
          )}
        </>
      }
    >
      {employee && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EmployeeIdentity employee={employee} size="md" />
            {!isLoading && !error && (
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">
                  {records.length}
                </span>{" "}
                of {HISTORY_DAYS} days recorded
              </p>
            )}
          </div>
          {renderBody()}
        </div>
      )}
    </Modal>
  );
}
