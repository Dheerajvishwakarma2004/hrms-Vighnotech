import { useCallback, useMemo } from "react";
import { startOfMonth } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useSearchParamsUpdater } from "@/hooks/useSearchParamsUpdater";
import { fromDateKey, isValidDateKey, todayKey } from "@/lib/date";
import { parseMonthKey, toMonthKey } from "../utils/calendar";

const DATE_PARAM = "date";
const MONTH_PARAM = "month";

/**
 * Leave-calendar state kept in the URL (`?date=YYYY-MM-DD&month=YYYY-MM`) so the selected day survives
 * reloads and can be shared. Independent of the leave-list filters: changing it never resets list paging.
 *
 * - `date` defaults to today; invalid values fall back to today.
 * - `month` defaults to the month of the selected date.
 */
export function useCalendarParams() {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
  const rawDate = searchParams.get(DATE_PARAM);
  const rawMonth = searchParams.get(MONTH_PARAM);
  const today = todayKey();

  const selectedDate = isValidDateKey(rawDate) ? rawDate : today;
  const monthKey = parseMonthKey(rawMonth)
    ? rawMonth
    : toMonthKey(fromDateKey(selectedDate));
  const month = useMemo(() => parseMonthKey(monthKey), [monthKey]);

  const update = useCallback(
    (patch) => {
      updateSearchParams(
        (params) => {
          Object.entries(patch).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
          });
        },
        { replace: true },
      );
    },
    [updateSearchParams],
  );

  /** Selects a day and shows its month (so clicking a leading/trailing day flips the month). */
  const selectDate = useCallback(
    (dateKey) =>
      update({
        [DATE_PARAM]: dateKey,
        [MONTH_PARAM]: toMonthKey(fromDateKey(dateKey)),
      }),
    [update],
  );

  /** Shows another month without changing the selected day. */
  const showMonth = useCallback(
    (date) => update({ [MONTH_PARAM]: toMonthKey(startOfMonth(date)) }),
    [update],
  );

  /** Jumps to the current month and selects today. */
  const goToToday = useCallback(() => selectDate(todayKey()), [selectDate]);

  return { selectedDate, month, today, selectDate, showMonth, goToToday };
}
