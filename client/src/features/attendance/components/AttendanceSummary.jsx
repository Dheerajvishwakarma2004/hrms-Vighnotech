import { cn } from "@/lib/cn";
import { COLOR_CLASSES, getStatusColor } from "@/lib/colors";
import Skeleton from "@/components/ui/Skeleton";
import { NOT_MARKED } from "@/lib/constants";

function SummaryChip({ label, count, dotClassName, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors sm:h-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        active
          ? "border-primary-300 bg-primary-50 text-primary-800 ring-1 ring-primary-300"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-2 w-2 shrink-0 rounded-full", dotClassName)}
      />
      <span className="font-medium">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">{count}</span>
    </button>
  );
}

/**
 * Per-status counts for the selected day (over the filtered roster, ignoring the status filter).
 * Each chip toggles the status filter; "All" clears it.
 *
 * @param {Record<string, number>} [summary] `meta.summary` from the roster endpoint
 * @param {string[]} statuses attendance statuses from the meta options
 * @param {string} activeStatus current status filter ('' = all)
 * @param {(status: string) => void} onSelect
 * @param {boolean} [loading] first load → skeleton chips
 * @param {boolean} [fetching] background refetch → dims the counts
 */
export default function AttendanceSummary({
  summary,
  statuses,
  activeStatus,
  onSelect,
  loading = false,
  fetching = false,
}) {
  const keys = [...statuses, NOT_MARKED];
  const total = Object.values(summary ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  );
  const marked = total - (summary?.[NOT_MARKED] ?? 0);
  const percent = total > 0 ? Math.round((marked / total) * 100) : 0;

  if (loading && !summary) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-11 w-28 shrink-0 rounded-full sm:h-10"
          />
        ))}
      </div>
    );
  }

  return (
    <section
      aria-label="Attendance summary"
      aria-busy={fetching || undefined}
      className={cn("space-y-3 transition-opacity", fetching && "opacity-60")}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{marked}</span> of{" "}
          <span className="font-semibold text-slate-900">{total}</span>{" "}
          employees marked
        </p>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-200 sm:w-48"
          role="progressbar"
          aria-label="Attendance marked"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-primary-500 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <SummaryChip
          label="All"
          count={total}
          dotClassName={COLOR_CLASSES.primary.dot}
          active={!activeStatus}
          onClick={() => onSelect("")}
        />
        {keys.map((status) => (
          <SummaryChip
            key={status}
            label={status}
            count={summary?.[status] ?? 0}
            dotClassName={COLOR_CLASSES[getStatusColor(status)].dot}
            active={activeStatus === status}
            onClick={() => onSelect(status)}
          />
        ))}
      </div>
    </section>
  );
}
