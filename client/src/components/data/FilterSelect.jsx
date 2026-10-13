import Select from '@/components/ui/Select';

/**
 * Select for a FilterBar. Keeps a URL value selectable even when it is no longer among the API options
 * (e.g. `?position=Old Title`), so the field always reflects the filter that is actually applied.
 *
 * @param {string} name filter key in the URL
 * @param {string} label accessible label ("Filter by …")
 * @param {string} placeholder empty option meaning "no filter" (e.g. "All departments")
 * @param {Array<string|{ value: string, label: string }>} options
 * @param {string} value current filter value
 * @param {(patch: object) => void} onChange receives `{ [name]: value }`
 */
export default function FilterSelect({ name, label, placeholder, options, value, onChange, disabled }) {
  const values = options.map((option) => (typeof option === 'object' ? option.value : option));
  const items = value && !values.includes(value) ? [value, ...options] : options;

  return (
    <Select
      id={`filter-${name}`}
      aria-label={label}
      placeholder={placeholder}
      options={items}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange({ [name]: event.target.value })}
    />
  );
}
