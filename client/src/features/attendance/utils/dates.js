import { addDays, differenceInCalendarDays } from "date-fns";
import { fromDateKey, isValidDateKey, toDateKey, todayKey } from "@/lib/date";

/**
 * Normalizes the `date` URL param: empty, malformed or impossible dates fall back to today,
 * and future dates are clamped to today (attendance cannot be marked in advance).
 */
export function resolveAttendanceDate(value) {
  const today = todayKey();
  if (!isValidDateKey(value)) return today;
  return value > today ? today : value;
}

/** `YYYY-MM-DD` shifted by a number of calendar days. */
export function shiftDateKey(key, days) {
  return toDateKey(addDays(fromDateKey(key), days));
}

/** Inclusive `{ from, to }` range covering the last `days` days up to today. */
export function getRecentRange(days) {
  const to = todayKey();
  return { from: shiftDateKey(to, -(days - 1)), to };
}

/** "Today", "Yesterday" or "5 days ago" for a past date key. */
export function describeDateKey(key) {
  const diff = differenceInCalendarDays(
    fromDateKey(todayKey()),
    fromDateKey(key),
  );
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}
