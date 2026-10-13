import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { formatDate, todayKey } from "@/lib/date";
import { describeDateKey, shiftDateKey } from "../utils/dates";

/**
 * Day picker for the roster: previous/next day, a native date input capped at today, and a "Today" shortcut.
 * @param {string} date selected `YYYY-MM-DD`
 * @param {(date: string) => void} onChange
 */
export default function AttendanceDateNav({ date, onChange }) {
  const today = todayKey();
  const isToday = date >= today;

  const handleInputChange = (event) => {
    const { value } = event.target;
    if (!value) return;
    onChange(value > today ? today : value);
  };

  return (
    <Card className="flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <CalendarDays aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {describeDateKey(date)}
          </p>
          <p
            className="truncate font-display text-base font-semibold text-slate-900 sm:text-lg"
            aria-live="polite"
          >
            {formatDate(date, "EEEE, d MMMM")}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="secondary"
          icon={ChevronLeft}
          iconOnly
          onClick={() => onChange(shiftDateKey(date, -1))}
        >
          Previous day
        </Button>
        <Input
          id="attendance-date"
          type="date"
          value={date}
          max={today}
          onChange={handleInputChange}
          aria-label="Attendance date"
          className="min-w-0 flex-1 md:w-44 md:flex-none"
          title="Pick a date"
        />
        <Button
          variant="secondary"
          icon={ChevronRight}
          iconOnly
          disabled={isToday}
          onClick={() => onChange(shiftDateKey(date, 1))}
        >
          Next day
        </Button>
        <Button
          variant="soft"
          disabled={isToday}
          onClick={() => onChange(today)}
        >
          Today
        </Button>
      </div>
    </Card>
  );
}
