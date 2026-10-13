import FilterBar from "@/components/data/FilterBar";
import FilterSelect from "@/components/data/FilterSelect";
import SearchInput from "@/components/ui/SearchInput";
import { NOT_MARKED } from "@/lib/constants";

/**
 * Search + filters for the roster. All option lists come from the meta options endpoint.
 * @param {Record<string, string|number>} filters current URL filters
 * @param {object} options `useMetaOptions().options`
 * @param {(patch: object) => void} onChange merges a patch into the URL filters
 */
export default function AttendanceFilters({
  filters,
  options,
  activeCount,
  onChange,
  onReset,
}) {
  const selects = [
    {
      name: "department",
      label: "Filter by department",
      placeholder: "All departments",
      options: options.departments,
    },
    {
      name: "role",
      label: "Filter by role",
      placeholder: "All roles",
      options: options.roles,
    },
    {
      name: "position",
      label: "Filter by position",
      placeholder: "All positions",
      options: options.positions,
    },
    {
      name: "status",
      label: "Filter by attendance status",
      placeholder: "All statuses",
      options: [...options.attendanceStatuses, NOT_MARKED],
    },
  ];

  return (
    <FilterBar
      activeCount={activeCount}
      onReset={onReset}
      search={
        <SearchInput
          value={filters.search}
          onChange={(search) => onChange({ search })}
          placeholder="Search by name or email…"
          aria-label="Search employees"
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
    </FilterBar>
  );
}
