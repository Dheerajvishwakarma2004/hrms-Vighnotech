import { useMemo } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import { toDateKey } from "@/lib/date";
import { useCalendarParams } from "../hooks/useCalendarParams";
import { useGetLeaveCalendarQuery } from "../leavesApi";
import {
  buildMonthGrid,
  groupLeavesByDay,
  leaveCoversDate,
  leaveDateKey,
} from "../utils/calendar";
import ApprovedLeavesForDate from "./ApprovedLeavesForDate";
import LeaveCalendar from "./LeaveCalendar";

const NO_LEAVES = [];

/**
 * Calendar panel: month grid of approved leaves + the approved leaves of the selected day.
 * Visible month and selected day live in the URL (`?month=&date=`). The day list reuses the month's data
 * when the day is on the visible grid, and fetches that single day otherwise.
 */
export default function LeaveCalendarSection({ downloader }) {
  const { selectedDate, month, today, selectDate, showMonth, goToToday } =
    useCalendarParams();
  const grid = useMemo(() => buildMonthGrid(month), [month]);

  const calendarQuery = useGetLeaveCalendarQuery({
    start: grid.startKey,
    end: grid.endKey,
  });
  const gridLeaves = calendarQuery.currentData ?? NO_LEAVES;
  const leavesByDay = useMemo(
    () => groupLeavesByDay(gridLeaves, grid.days),
    [gridLeaves, grid],
  );

  const monthLeaveCount = useMemo(() => {
    const monthStart = toDateKey(startOfMonth(month));
    const monthEnd = toDateKey(endOfMonth(month));
    return gridLeaves.filter(
      (leave) =>
        leaveDateKey(leave.startDate) <= monthEnd &&
        leaveDateKey(leave.endDate) >= monthStart,
    ).length;
  }, [gridLeaves, month]);

  const dateOnGrid =
    selectedDate >= grid.startKey && selectedDate <= grid.endKey;
  const dayQuery = useGetLeaveCalendarQuery(
    { start: selectedDate, end: selectedDate },
    { skip: dateOnGrid },
  );

  const day = dateOnGrid
    ? {
        leaves: leavesByDay.get(selectedDate) ?? NO_LEAVES,
        loading: calendarQuery.isFetching && !calendarQuery.currentData,
        error: calendarQuery.isError ? calendarQuery.error : null,
        retry: calendarQuery.refetch,
      }
    : {
        leaves: (dayQuery.currentData ?? NO_LEAVES).filter((leave) =>
          leaveCoversDate(leave, selectedDate),
        ),
        loading: dayQuery.isFetching && !dayQuery.currentData,
        error: dayQuery.isError ? dayQuery.error : null,
        retry: dayQuery.refetch,
      };

  // Side by side when the section spans the page (below 2xl), stacked in the narrow 2xl side column.
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-1">
      <LeaveCalendar
        month={month}
        grid={grid}
        leavesByDay={leavesByDay}
        monthLeaveCount={monthLeaveCount}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={selectDate}
        onMonthChange={showMonth}
        onToday={goToToday}
        loading={calendarQuery.isFetching && !calendarQuery.currentData}
        fetching={calendarQuery.isFetching}
        error={calendarQuery.isError ? calendarQuery.error : null}
        onRetry={calendarQuery.refetch}
      />
      <ApprovedLeavesForDate
        dateKey={selectedDate}
        isToday={selectedDate === today}
        leaves={day.leaves}
        loading={day.loading}
        error={day.error}
        onRetry={day.retry}
        downloader={downloader}
      />
    </div>
  );
}
