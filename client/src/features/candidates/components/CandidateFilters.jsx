import FilterBar from '@/components/data/FilterBar';
import FilterSelect from '@/components/data/FilterSelect';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import { CANDIDATE_SORT_OPTIONS } from '../constants';
import ExperienceRangeFilter from './ExperienceRangeFilter';

/**
 * Search + filters + sort for the candidate list. All values are URL-backed (see useUrlFilters);
 * dropdown options come from the meta API.
 *
 * @param {Record<string, string|number>} filters current URL filters
 * @param {object} options `useMetaOptions().options`
 * @param {(patch: object) => void} onChange merges a patch into the URL filters
 * @param {number} activeCount number of non-default filters
 * @param {() => void} onReset
 */
export default function CandidateFilters({ filters, options, onChange, activeCount, onReset }) {
  const selects = [
    {
      name: 'status',
      label: 'Filter by status',
      placeholder: 'All statuses',
      options: options.candidateStatuses,
    },
    {
      name: 'department',
      label: 'Filter by department',
      placeholder: 'All departments',
      options: options.departments,
    },
    {
      name: 'position',
      label: 'Filter by position',
      placeholder: 'All positions',
      options: options.positions,
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
          aria-label="Search candidates"
        />
      }
      extra={
        <Select
          id="candidate-sort"
          aria-label="Sort candidates"
          className="w-44"
          value={`${filters.sortBy}:${filters.sortOrder}`}
          options={CANDIDATE_SORT_OPTIONS}
          onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(':');
            onChange({ sortBy, sortOrder });
          }}
        />
      }
    >
      {selects.map((select) => (
        <FilterSelect key={select.name} {...select} value={filters[select.name]} onChange={onChange} />
      ))}
      <ExperienceRangeFilter
        className="min-[400px]:col-span-2"
        min={filters.minExperience}
        max={filters.maxExperience}
        onChange={({ min, max }) => onChange({ minExperience: min, maxExperience: max })}
      />
    </FilterBar>
  );
}
