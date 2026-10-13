import { useEffect, useMemo, useRef } from "react";
import { addDays, addMonths, format, subMonths } from "date-fns";
import { CalendarCheck2, ChevronLeft, ChevronRight } from "lucide-react";
import ErrorState from "@/components/feedback/ErrorState";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { fromDateKey, toDateKey } from "@/lib/date";
import { getWeekdayLabels } from "../utils/calendar";
import CalendarDayCell from "./CalendarDayCell";

const WEEKDAYS = getWeekdayLabels();
const KEY_OFFSETS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
const EMPTY = [];

/**
 * Month grid of APPROVED leaves (Monday first, leading/trailing days muted).
 * Arrow keys move the selected day; the grid uses a roving tab stop.
 *
 * @param {Date} month first day of the visible month
 * @param {{ days: Array<{date, key, inMonth}> }} grid from `buildMonthGrid`
 * @param {Map<string, Array>} leavesByDay approved leaves per day key
 * @param {number} monthLeaveCount approved leaves overlapping the visible month
 * @param {string} selectedDate `YYYY-MM-DD`
 * @param {string} today `YYYY-MM-DD`
 * @param {(dateKey: string) => void} onSelectDate
 * @param {(month: Date) => void} onMonthChange
 * @param {() => void} onToday
 */
export default function LeaveCalendar({
  month,
  grid,
  leavesByDay,
  monthLeaveCount,
  selectedDate,
  today,
  onSelectDate,
  onMonthChange,
  onToday,
  loading,
  fetching,
  error,
  onRetry,
}) {
  const gridRef = useRef(null);
  const focusAfterSelect = useRef(false);
  const monthLabel = format(month, "MMMM yyyy");

  const tabStopKey = useMemo(() => {
    const keys = grid.days.map((day) => day.key);
    if (keys.includes(selectedDate)) return selectedDate;
    return grid.days.find((day) => day.inMonth)?.key;
  }, [grid, selectedDate]);

  // After keyboard navigation (possibly into another month), move focus to the newly selected day.
  useEffect(() => {
    if (!focusAfterSelect.current) return;
    focusAfterSelect.current = false;
    gridRef.current?.querySelector(`[data-date="${selectedDate}"]`)?.focus();
  }, [selectedDate, grid]);

  const onGridKeyDown = (event) => {
    const offset = KEY_OFFSETS[event.key];
    const current = event.target.dataset?.date;
    if (!offset || !current) return;
    event.preventDefault();
    focusAfterSelect.current = true;
    onSelectDate(toDateKey(addDays(fromDateKey(current), offset)));
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="font-display text-base font-semibold text-slate-900 sm:text-lg"
              aria-live="polite"
            >
              {monthLabel}
            </h3>
            {fetching && (
              <Spinner
                size="xs"
                className="text-primary-500"
                label="Loading approved leaves"
              />
            )}
          </div>
          <p className="text-xs text-slate-500">
            Only approved leaves are shown
            {!loading && !error && ` · ${monthLeaveCount} this month`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={ChevronLeft}
            onClick={() => onMonthChange(subMonths(month, 1))}
          >
            Previous month
          </Button>
          <Button
            size="sm"
            icon={CalendarCheck2}
            onClick={onToday}
            aria-label="Today: show the current month and today's approved leaves"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={ChevronRight}
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            Next month
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState
          compact
          title="Couldn't load the calendar"
          error={error}
          onRetry={onRetry}
        />
      ) : (
        <div className="p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday.long}
                className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
              >
                <span className="sm:hidden">{weekday.narrow}</span>
                <span className="hidden sm:inline">{weekday.short}</span>
              </div>
            ))}
          </div>
          <div
            ref={gridRef}
            role="group"
            aria-label={`${monthLabel} — select a day to see its approved leaves`}
            aria-busy={loading || undefined}
            onKeyDown={onGridKeyDown}
            className="grid grid-cols-7 gap-1"
          >
            {grid.days.map((day) => (
              <CalendarDayCell
                key={day.key}
                day={day}
                leaves={leavesByDay.get(day.key) ?? EMPTY}
                isSelected={day.key === selectedDate}
                isToday={day.key === today}
                tabIndex={day.key === tabStopKey ? 0 : -1}
                onSelect={onSelectDate}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-primary-500"
              />
              Someone is on approved leave
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full ring-2 ring-primary-500"
              />
              Today
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full bg-primary-600"
              />
              Selected day
            </li>
          </ul>
        </div>
      )}
    </Card>
  );
}
