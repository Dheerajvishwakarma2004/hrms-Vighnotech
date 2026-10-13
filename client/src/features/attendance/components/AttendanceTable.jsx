import { useMemo } from "react";
import { ClipboardEdit, Eraser, History, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/data/DataTable";
import EmployeeIdentity from "@/components/data/EmployeeIdentity";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { ROUTES } from "@/lib/constants";
import { formatDateTime, formatRelative } from "@/lib/date";
import AttendanceStatusSelect from "./AttendanceStatusSelect";
import AttendanceTaskCell from "./AttendanceTaskCell";

/** Container widths (px): the table needs `table`; lower-priority columns appear as space allows. */
const WIDTHS = { table: 920, details: 1130, position: 1260 };

const getRowKey = (row) => row.employee._id;

function LastUpdated({ attendance }) {
  if (!attendance?.updatedAt) return <span className="text-slate-400">—</span>;
  return (
    <time
      dateTime={attendance.updatedAt}
      title={formatDateTime(attendance.updatedAt)}
      className="whitespace-nowrap"
    >
      {formatRelative(attendance.updatedAt)}
    </time>
  );
}

/**
 * Daily attendance roster. Status is editable inline; the task opens the task modal.
 *
 * @param {Array<{ employee: object, attendance: object|null }>} rows
 * @param {{ page: number, limit: number }} meta pagination meta (for the serial number)
 * @param {string} date selected `YYYY-MM-DD`
 * @param {string[]} statuses attendance statuses from the meta options
 * @param {(row) => void} onEditTask
 * @param {(employee) => void} onViewHistory
 * @param {(row) => void} onClear
 */
export default function AttendanceTable({
  rows,
  meta,
  date,
  statuses,
  loading,
  fetching,
  error,
  onRetry,
  sort,
  onSortChange,
  empty,
  onEditTask,
  onViewHistory,
  onClear,
}) {
  const navigate = useNavigate();
  const offset = ((meta?.page ?? 1) - 1) * (meta?.limit ?? 0);

  const columns = useMemo(
    () => [
      {
        key: "serial",
        header: "Sr. No.",
        hideInCards: true,
        hideBelow: WIDTHS.details,
        className: "w-16 tabular-nums text-slate-500",
        render: (_row, index) => offset + index + 1,
      },
      {
        key: "fullName",
        header: "Employee",
        sortable: true,
        render: (row) => (
          <EmployeeIdentity
            employee={row.employee}
            linked
            className="in-table:max-w-[13rem]"
          />
        ),
      },
      {
        key: "position",
        header: "Position",
        sortable: true,
        hideBelow: WIDTHS.position,
        render: (row) => row.employee.position,
      },
      {
        key: "department",
        header: "Department",
        sortable: true,
        render: (row) => row.employee.department,
      },
      {
        key: "role",
        header: "Role",
        sortable: true,
        render: (row) => row.employee.role,
      },
      {
        key: "task",
        header: "Task",
        className: "min-w-[10rem] max-w-[13rem]",
        render: (row) => (
          <AttendanceTaskCell
            attendance={row.attendance}
            onEdit={() => onEditTask(row)}
          />
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <AttendanceStatusSelect
            row={row}
            date={date}
            statuses={statuses}
            className="in-table:w-36"
          />
        ),
      },
      {
        key: "updatedAt",
        header: "Last updated",
        mobileLabel: "Updated",
        hideBelow: WIDTHS.details,
        className: "text-slate-500",
        render: (row) => <LastUpdated attendance={row.attendance} />,
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        className: "w-12",
        render: (row) => (
          <DropdownMenu
            label={`Actions for ${row.employee.fullName}`}
            items={[
              {
                label: row.attendance
                  ? "Update task & status"
                  : "Mark attendance",
                icon: ClipboardEdit,
                onClick: () => onEditTask(row),
              },
              {
                label: "Attendance history",
                icon: History,
                onClick: () => onViewHistory(row.employee),
              },
              {
                label: "View profile",
                icon: UserRound,
                onClick: () =>
                  navigate(ROUTES.employeeDetails(row.employee._id)),
              },
              {
                label: "Clear record",
                icon: Eraser,
                danger: true,
                hidden: !row.attendance?._id,
                onClick: () => onClear(row),
              },
            ]}
          />
        ),
      },
    ],
    [offset, date, statuses, onEditTask, onViewHistory, onClear, navigate],
  );

  return (
    <DataTable
      caption="Attendance roster"
      columns={columns}
      data={rows}
      rowKey={getRowKey}
      tableMinWidth={WIDTHS.table}
      loading={loading}
      fetching={fetching}
      error={error}
      onRetry={onRetry}
      sort={sort}
      onSortChange={onSortChange}
      empty={empty}
      skeletonRows={meta?.limit ? Math.min(meta.limit, 8) : 6}
    />
  );
}
