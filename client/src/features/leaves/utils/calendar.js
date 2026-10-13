import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fromDateKey, isValidDateKey, toDateKey } from "@/lib/date";

const WEEK_STARTS_ON = 1; // Monday
const GRID_DAYS = 42; // 6 weeks — keeps the calendar height stable between months
const MONTH_KEY_FORMAT = "yyyy-MM";

/** `YYYY-MM` → Date at local midnight on the 1st, or null when invalid. */
export function parseMonthKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return null;
  const date = parse(value, MONTH_KEY_FORMAT, new Date());
  return isValid(date) ? date : null;
}

export function toMonthKey(date) {
  return format(date, MONTH_KEY_FORMAT);
}

/** Monday-first 6-week grid for the month containing `monthDate`. */
export function buildMonthGrid(monthDate) {
  const gridStart = startOfWeek(startOfMonth(monthDate), {
    weekStartsOn: WEEK_STARTS_ON,
  });
  const gridEnd = addDays(gridStart, GRID_DAYS - 1);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).map(
    (date) => ({
      date,
      key: toDateKey(date),
      inMonth: isSameMonth(date, monthDate),
    }),
  );
  return { days, startKey: days[0].key, endKey: days[days.length - 1].key };
}

/** Localised weekday labels in grid order: `[{ short: 'Mon', narrow: 'M', long: 'Monday' }, ...]`. */
export function getWeekdayLabels() {
  const monday = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(monday, index);
    return {
      short: format(day, "EEE"),
      narrow: format(day, "EEEEE"),
      long: format(day, "EEEE"),
    };
  });
}

/** Date-only key of an API date (ISO string at UTC midnight). */
export const leaveDateKey = (value) => String(value ?? "").slice(0, 10);

/** Whether the leave covers the calendar day `dateKey` (inclusive range). */
export function leaveCoversDate(leave, dateKey) {
  return (
    leaveDateKey(leave.startDate) <= dateKey &&
    dateKey <= leaveDateKey(leave.endDate)
  );
}

/**
 * Groups leaves by every grid day they cover: `Map<dateKey, leave[]>` (only grid days are indexed).
 */
export function groupLeavesByDay(leaves, days) {
  const byDay = new Map(days.map((day) => [day.key, []]));
  leaves.forEach((leave) => {
    days.forEach((day) => {
      if (leaveCoversDate(leave, day.key)) byDay.get(day.key).push(leave);
    });
  });
  return byDay;
}

/** Inclusive number of calendar days between two `YYYY-MM-DD` keys (0 when invalid or reversed). */
export function countDays(startKey, endKey) {
  if (!isValidDateKey(startKey) || !isValidDateKey(endKey) || endKey < startKey)
    return 0;
  return (
    differenceInCalendarDays(fromDateKey(endKey), fromDateKey(startKey)) + 1
  );
}
