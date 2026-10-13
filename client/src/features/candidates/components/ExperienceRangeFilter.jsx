import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import Input from '@/components/ui/Input';
import { EXPERIENCE_RANGE } from '../constants';

function getRangeError({ min, max }) {
  const values = [min, max].filter((value) => value !== '');
  if (values.some((value) => !Number.isFinite(Number(value)))) return 'Enter numbers only';
  if (values.some((value) => Number(value) < EXPERIENCE_RANGE.min || Number(value) > EXPERIENCE_RANGE.max)) {
    return `Use ${EXPERIENCE_RANGE.min}–${EXPERIENCE_RANGE.max} years`;
  }
  if (min !== '' && max !== '' && Number(min) > Number(max)) return 'Min must be ≤ max';
  return null;
}

const isSameRange = (a, b) => a.min === b.min && a.max === b.max;

/**
 * Min/max years-of-experience inputs. Typing is debounced and only valid ranges are committed,
 * so the list never requests a range the server would reject. External changes (reset, back
 * navigation) are synced back into the inputs.
 *
 * @param {string} min committed minimum ('' = no bound)
 * @param {string} max committed maximum ('' = no bound)
 * @param {(range: { min: string, max: string }) => void} onChange
 */
export default function ExperienceRangeFilter({ min, max, onChange, className }) {
  const [draft, setDraft] = useState({ min, max });
  const debounced = useDebounce(draft);
  const committed = useRef({ min, max });
  const onChangeRef = useRef(onChange);
  const error = getRangeError(draft);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const commit = useCallback((range) => {
    if (getRangeError(range) || isSameRange(range, committed.current)) return;
    committed.current = range;
    onChangeRef.current(range);
  }, []);

  useEffect(() => {
    commit(debounced);
  }, [debounced, commit]);

  useEffect(() => {
    const external = { min, max };
    if (!isSameRange(external, committed.current)) {
      committed.current = external;
      setDraft(external);
    }
  }, [min, max]);

  const update = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value.trim() }));
  const onKeyDown = (event) => {
    if (event.key === 'Enter') commit(draft);
  };

  const inputProps = {
    type: 'number',
    inputMode: 'decimal',
    min: EXPERIENCE_RANGE.min,
    max: EXPERIENCE_RANGE.max,
    step: 'any',
    error: Boolean(error),
    onKeyDown,
    inputClassName: 'px-2.5',
  };

  return (
    <div role="group" aria-label="Experience in years" title={error ?? 'Experience (years)'} className={className}>
      <div className="flex items-center gap-1.5">
        <Input
          id="candidate-min-experience"
          aria-label="Minimum experience (years)"
          placeholder="Min exp (yrs)"
          value={draft.min}
          onChange={update('min')}
          className="min-w-0 flex-1"
          {...inputProps}
        />
        <span aria-hidden="true" className="text-slate-400">
          –
        </span>
        <Input
          id="candidate-max-experience"
          aria-label="Maximum experience (years)"
          placeholder="Max exp (yrs)"
          value={draft.max}
          onChange={update('max')}
          className="min-w-0 flex-1"
          {...inputProps}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
