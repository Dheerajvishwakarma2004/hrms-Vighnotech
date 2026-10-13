import { memo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/format";

const MAX_DOTS = 3;
const MAX_NAMES = 2;

const firstName = (leave) =>
  leave.employee?.fullName?.split(" ")[0] ?? "Unknown";

/**
 * One day of the leave calendar.
 * Phones and the narrow xl side panel show colored dots; tablet/desktop widths (sm–lg, full-width calendar)
 * show employee name chips. Every cell stays a >= 44px tap target.
 */
function CalendarDayCell({
  day,
  leaves,
  isSelected,
  isToday,
  tabIndex,
  onSelect,
}) {
  const count = leaves.length;
  const label = `${format(day.date, "EEEE, d MMMM yyyy")}${isToday ? " (today)" : ""}: ${
    count === 0 ? "no approved leaves" : pluralize(count, "approved leave")
  }`;

  return (
    <button
      type="button"
      data-date={day.key}
      tabIndex={tabIndex}
      aria-label={label}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      onClick={() => onSelect(day.key)}
      className={cn(
        "relative flex min-w-0 flex-col items-center gap-1 rounded-lg p-1 text-left transition-colors",
        "h-14 sm:h-auto sm:min-h-[5.75rem] sm:items-stretch sm:border sm:p-1.5 xl:h-12 xl:min-h-0 xl:items-center xl:border-0 xl:p-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
        isSelected
          ? "bg-primary-50 ring-2 ring-inset ring-primary-500 sm:border-transparent"
          : cn(
              "hover:bg-slate-50 sm:border-slate-100",
              !day.inMonth && "bg-slate-50/60",
            ),
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-medium sm:text-sm",
          isSelected && "bg-primary-600 font-semibold text-white",
          !isSelected &&
            isToday &&
            "font-bold text-primary-800 ring-2 ring-primary-500",
          !isSelected &&
            !isToday &&
            (day.inMonth ? "text-slate-700" : "text-slate-400"),
        )}
      >
        {format(day.date, "d")}
      </span>

      {count > 0 && (
        <>
          {/* Compact: dots (phones and the xl side panel) */}
          <span
            aria-hidden="true"
            className="flex items-center gap-0.5 sm:hidden xl:flex"
          >
            {leaves.slice(0, MAX_DOTS).map((leave) => (
              <span
                key={leave._id}
                className={cn("h-2 w-2 rounded-full", "bg-primary-500")}
              />
            ))}
            {count > MAX_DOTS && (
              <span className="text-[9px] font-semibold leading-none text-slate-500">
                +{count - MAX_DOTS}
              </span>
            )}
          </span>

          {/* Roomy: name chips (full-width calendar on tablets / small laptops) */}
          <span
            aria-hidden="true"
            className="hidden min-w-0 flex-col gap-0.5 sm:flex xl:hidden"
          >
            {leaves.slice(0, MAX_NAMES).map((leave) => (
              <span
                key={leave._id}
                className={cn(
                  "truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight",
                  "bg-primary-100 text-primary-800",
                )}
              >
                {firstName(leave)}
              </span>
            ))}
            {count > MAX_NAMES && (
              <span className="px-1 text-[11px] font-medium text-slate-500">
                +{count - MAX_NAMES} more
              </span>
            )}
          </span>
        </>
      )}
    </button>
  );
}

export default memo(CalendarDayCell);
