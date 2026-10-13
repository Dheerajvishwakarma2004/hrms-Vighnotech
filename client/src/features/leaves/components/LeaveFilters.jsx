import FilterBar from "@/components/data/FilterBar";
import FilterSelect from "@/components/data/FilterSelect";
import { formatDate } from "@/lib/date";
import { countDays } from "../utils/calendar";
import Input from "@/components/ui/Input";
import SearchInput from "@/components/ui/SearchInput";

/**
 * Leave request filters (all values live in the URL via `useUrlFilters`).
 * `from`/`to` select leaves that overlap the date range; `to` can never be before `from`.
 *
 * @param {object} options `useMetaOptions().options`
 * @param {(patch: object) => void} onChange merges a patch into the URL filters
 */
export default function LeaveFilters({
  filters,
  options,
  onChange,
  activeCount,
  onReset,
}) {
  const selects = [
    {
      name: "status",
      label: "Filter by status",
      placeholder: "All statuses",
      options: options.leaveStatuses,
    },
    {
      name: "leaveType",
      label: "Filter by leave type",
      placeholder: "All leave types",
      options: options.leaveTypes,
    },
    {
      name: "department",
      label: "Filter by department",
      placeholder: "All departments",
      options: options.departments,
    },
  ];

  const onFromChange = (from) =>
    onChange(
      from && filters.to && filters.to < from ? { from, to: "" } : { from },
    );
  const onToChange = (to) =>
    onChange(
      to && filters.from && to < filters.from ? { from: "", to } : { to },
    );

  const days = countDays(filters.from, filters.to);
  let rangeText = "";
  if (filters.from && filters.to) {
    rangeText = `Showing leaves between ${formatDate(filters.from, "d MMM")} and ${formatDate(filters.to, "d MMM yyyy")} (${days} ${days === 1 ? "day" : "days"})`;
  } else if (filters.from)
    rangeText = `Showing leaves from ${formatDate(filters.from, "d MMM yyyy")} onwards`;
  else if (filters.to)
    rangeText = `Showing leaves up to ${formatDate(filters.to, "d MMM yyyy")}`;

  return (
    <div className="space-y-2">
      <FilterBar
        activeCount={activeCount}
        onReset={onReset}
        search={
          <SearchInput
            value={filters.search}
            onChange={(search) => onChange({ search })}
            placeholder="Search by name or email…"
            aria-label="Search leave requests by employee name, email or position"
          />
        }
      >
        {selects.map((select) => (
          <FilterSelect
            key={select.name}
            {...select}
            value={filters[select.name]}
            onChange={onChange}
          />
        ))}
        <DateFilter
          label="From"
          value={filters.from}
          max={filters.to || undefined}
          onChange={onFromChange}
        />
        <DateFilter
          label="To"
          value={filters.to}
          min={filters.from || undefined}
          onChange={onToChange}
        />
      </FilterBar>
      {rangeText && <p className="px-1 text-sm text-slate-600">{rangeText}</p>}
    </div>
  );
}

function DateFilter({ label, value, min, max, onChange }) {
  return (
    <Input
      type="date"
      leftAddon={label}
      value={value}
      min={min}
      max={max}
      aria-label={`${label} date`}
      title={`Leaves overlapping this range (${label.toLowerCase()})`}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
