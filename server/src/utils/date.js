/*
 * Date-only values (attendance date, leave dates, date of joining) travel as `YYYY-MM-DD`
 * strings and are stored as `Date` at UTC midnight of that calendar day to avoid timezone drift.
 * "Today" is always the calendar day in India (IST), never the UTC day.
 */

/** The business time zone: HR works in India Standard Time (UTC+05:30, no daylight saving). */
export const APP_TIME_ZONE = 'Asia/Kolkata';

export const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const istDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const toDateKey = (date) => date.toISOString().slice(0, 10);

export const fromDateKey = (key) => new Date(`${key}T00:00:00.000Z`);

export const isValidDateKey = (key) => {
  if (typeof key !== 'string' || !DATE_KEY_REGEX.test(key)) return false;
  const date = fromDateKey(key);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === key;
};

/** Today's calendar date in IST as `YYYY-MM-DD`. */
export const todayKey = () => istDateFormat.format(new Date());

/** Today (IST calendar day) as a Date at UTC midnight - the storage format for date-only values. */
export const todayDate = () => fromDateKey(todayKey());

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

/** Inclusive number of calendar days between two UTC-midnight dates. */
export const inclusiveDays = (start, end) => Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;

/** Number of days of [start, end] that fall inside [rangeStart, rangeEnd] (all UTC midnight). */
export const overlappingDays = (start, end, rangeStart, rangeEnd) => {
  const from = Math.max(start.getTime(), rangeStart.getTime());
  const to = Math.min(end.getTime(), rangeEnd.getTime());
  return to < from ? 0 : Math.round((to - from) / DAY_MS) + 1;
};
