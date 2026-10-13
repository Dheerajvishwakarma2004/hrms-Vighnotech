import { useMemo, useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/data/DataTable";
import EmployeeIdentity from "@/components/data/EmployeeIdentity";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { formatDateRange } from "@/lib/date";
import { pluralize } from "@/lib/format";
import { leaveDocumentPath } from "../leavesApi";
import LeaveDocumentButton from "./LeaveDocumentButton";
import LeaveStatusSelect from "./LeaveStatusSelect";
import LeaveTypeBadge from "./LeaveTypeBadge";

/** Container widths (px): the compact table (no reason) fits beside the calendar; the reason needs more room. */
const WIDTHS = { table: 860 };

/** Reason clamped to two lines; long text can be expanded in place (and is available as a tooltip). */
function ReasonCell({ reason }) {
  const [expanded, setExpanded] = useState(false);
  const long = (reason ?? "").length > 70;
  return (
    <div className="min-w-0 in-table:max-w-[14rem]">
      <p
        title={reason}
        className={`whitespace-pre-line break-words text-sm text-slate-600 ${expanded ? "" : "line-clamp-2"}`}
      >
        {reason || "—"}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-0.5 inline-flex h-8 items-center rounded text-xs font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {expanded ? "Show less" : "Read full reason"}
        </button>
      )}
    </div>
  );
}

/**
 * Leave requests: a table when there is room, cards otherwise, with inline status changes and row actions.
 *
 * @param {Array} leaves
 * @param {string[]} statusOptions leave statuses from the meta API
 * @param {{ download: Function, isDownloading: Function }} downloader `useDownload()` result
 * @param {(leave) => void} onEdit
 * @param {(leave) => void} onDelete
 * Remaining props (loading, fetching, error, onRetry, empty, sort, onSortChange) are passed to DataTable.
 */
export default function LeaveTable({
  leaves,
  statusOptions,
  downloader,
  onEdit,
  onDelete,
  ...tableProps
}) {
  const columns = useMemo(
    () => [
      {
        key: "employee",
        header: "Employee",
        render: (leave) => (
          <EmployeeIdentity
            employee={leave.employee}
            linked
            subtitle={[leave.employee?.position, leave.employee?.department]
              .filter(Boolean)
              .join(" · ")}
            title={[leave.employee?.position, leave.employee?.department]
              .filter(Boolean)
              .join(" · ")}
            className="in-table:max-w-[12rem]"
          />
        ),
      },
      {
        key: "dates",
        header: "Leave",
        sortable: true,
        sortKey: "startDate",
        render: (leave) => (
          <div className="space-y-1">
            <p className="whitespace-nowrap text-sm text-slate-800">
              {formatDateRange(leave.startDate, leave.endDate)}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <LeaveTypeBadge type={leave.leaveType} />
              {leave.days ? <span>{pluralize(leave.days, "day")}</span> : null}
            </div>
          </div>
        ),
      },
      {
        key: "reason",
        header: "Reason",
        render: (leave) => <ReasonCell reason={leave.reason} />,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (leave) => (
          <LeaveStatusSelect
            leave={leave}
            options={statusOptions}
            className="in-table:w-36"
          />
        ),
      },
      {
        key: "document",
        header: "Doc",
        mobileLabel: "Document",
        align: "center",
        render: (leave) => (
          <LeaveDocumentButton leave={leave} downloader={downloader} />
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        align: "right",
        className: "w-12",
        render: (leave) => (
          <DropdownMenu
            label={`Actions for ${leave.employee?.fullName ?? "leave"}`}
            items={[
              { label: "Edit", icon: Pencil, onClick: () => onEdit(leave) },
              {
                label: "Download document",
                icon: Download,
                hidden: !leave.document,
                disabled: downloader.isDownloading(leave._id),
                onClick: () =>
                  downloader.download(
                    leaveDocumentPath(leave._id),
                    leave.document.filename,
                    leave._id,
                  ),
              },
              {
                label: "Delete",
                icon: Trash2,
                danger: true,
                onClick: () => onDelete(leave),
              },
            ]}
          />
        ),
      },
    ],
    [statusOptions, downloader, onEdit, onDelete],
  );

  return (
    <DataTable
      caption="Leave requests"
      columns={columns}
      data={leaves}
      tableMinWidth={WIDTHS.table}
      {...tableProps}
    />
  );
}
