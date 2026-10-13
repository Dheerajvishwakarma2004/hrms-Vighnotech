import FilterBar from '@/components/data/FilterBar';
import FilterSelect from '@/components/data/FilterSelect';
import SearchInput from '@/components/ui/SearchInput';

/** Filter dropdowns: URL key → meta options list. */
const SELECT_FILTERS = [
  {
    name: 'department',
    optionsKey: 'departments',
    placeholder: 'All departments',
    label: 'Filter by department',
  },
  {
    name: 'role',
    optionsKey: 'roles',
    placeholder: 'All roles',
    label: 'Filter by role',
  },
  {
    name: 'position',
    optionsKey: 'positions',
    placeholder: 'All positions',
    label: 'Filter by position',
  },
  {
    name: 'employmentType',
    optionsKey: 'employmentTypes',
    placeholder: 'All types',
    label: 'Filter by employment type',
  },
  {
    name: 'status',
    optionsKey: 'employeeStatuses',
    placeholder: 'All statuses',
    label: 'Filter by status',
  },
];

/**
 * Search + attribute filters for the employee list. Values come from / go to the URL (useUrlFilters).
 * @param {object} options `useMetaOptions().options`
 * @param {(patch: object) => void} onChange merges a patch into the URL filters
 */
export default function EmployeeFilters({ filters, options, onChange, activeCount, onReset }) {
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
      {SELECT_FILTERS.map(({ name, optionsKey, placeholder, label }) => (
        <FilterSelect
          key={name}
          name={name}
          label={label}
          placeholder={placeholder}
          options={options[optionsKey]}
          value={filters[name]}
          onChange={onChange}
        />
      ))}
    </FilterBar>
  );
}
