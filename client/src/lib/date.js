import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';
/** Shape of a date-only value sent to / received from the API (`YYYY-MM-DD`). */
export const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
/** HR works in India Standard Time; every "today", clock time and timestamp is shown in IST. */
export const APP_TIME_ZONE = 'Asia/Kolkata';
const DISPLAY_DATE_FORMAT = 'dd MMM yyyy';
const DISPLAY_DATE_TIME_FORMAT = 'dd MMM yyyy, hh:mm a';

/** Local calendar date → `YYYY-MM-DD` (the format the API expects for date-only values). */
export function toDateKey(date) {
  return format(date, DATE_KEY_FORMAT);
}

/**
 * `YYYY-MM-DD` (or an ISO string from the API) → Date at LOCAL midnight of that calendar day.
 * Date-only values are stored at UTC midnight, so only the date part is used to avoid timezone shifts.
 */
export function fromDateKey(value) {
  return parseISO(String(value).slice(0, 10));
}

/** `YYYY-MM-DD` that is a real calendar date (rejects `2026-02-31`). */
export function isValidDateKey(value) {
  return typeof value === 'string' && DATE_KEY_REGEX.test(value) && toDateKey(fromDateKey(value)) === value;
}

/**
 * A Date whose local fields (hours, day, ...) read as the IST wall clock, so date-fns `format` and
 * `getHours` show India time regardless of the browser's time zone. Display use only.
 */
export function toAppZone(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: APP_TIME_ZONE }));
}

/** Today's calendar date in IST as `YYYY-MM-DD`. */
export function todayKey() {
  return toDateKey(toAppZone());
}

/** Formats a date-only value (ISO string, `YYYY-MM-DD` or Date). Returns an em dash for empty/invalid input. */
export function formatDate(value, pattern = DISPLAY_DATE_FORMAT) {
  if (!value) return '—';
  const date = value instanceof Date ? value : fromDateKey(value);
  return isValid(date) ? format(date, pattern) : '—';
}

/** Formats a real timestamp (createdAt / updatedAt) in IST. */
export function formatDateTime(value, pattern = DISPLAY_DATE_TIME_FORMAT) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? format(toAppZone(date), pattern) : '—';
}

/** "3 hours ago" style relative time for timestamps. */
export function formatRelative(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? formatDistanceToNowStrict(date, { addSuffix: true }) : '—';
}

/** "12 Mar – 14 Mar 2026" for date-only ranges; collapses to a single date when start === end. */
export function formatDateRange(start, end) {
  if (!start) return '—';
  const startKey = String(start).slice(0, 10);
  const endKey = end ? String(end).slice(0, 10) : startKey;
  if (startKey === endKey) return formatDate(startKey);
  const sameYear = startKey.slice(0, 4) === endKey.slice(0, 4);
  return `${formatDate(startKey, sameYear ? 'dd MMM' : DISPLAY_DATE_FORMAT)} – ${formatDate(endKey)}`;
}

/** Milliseconds → compact countdown: "1h 42m", "12m 05s", "45s". */
export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}
