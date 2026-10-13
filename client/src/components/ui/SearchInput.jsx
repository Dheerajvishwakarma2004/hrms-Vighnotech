import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/cn';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

/**
 * Search box with built-in debouncing and a clear button.
 * Typing updates local state immediately; `onChange` fires with the debounced value
 * (immediately on Enter / clear). External `value` changes (e.g. "Reset filters") are synced back in.
 *
 * @param {string} value current committed search (e.g. from useUrlFilters)
 * @param {(value: string) => void} onChange
 * @param {number} [delay] debounce in ms (default 400)
 */
export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search…',
  delay = SEARCH_DEBOUNCE_MS,
  className,
  'aria-label': ariaLabel,
  ...props
}) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, delay);
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const emit = useCallback((next) => {
    if (next === lastEmitted.current) return;
    lastEmitted.current = next;
    onChangeRef.current?.(next);
  }, []);

  // Debounced typing → commit.
  useEffect(() => {
    emit(debounced.trim());
  }, [debounced, emit]);

  // External value changed (reset / back navigation) → reflect it in the field.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(value);
    }
  }, [value]);

  const clear = () => {
    setText('');
    emit('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') emit(text.trim());
          if (event.key === 'Escape' && text) {
            event.stopPropagation();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="block h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-10 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400/80 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15 sm:h-10 sm:rounded-lg [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Clear search"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
