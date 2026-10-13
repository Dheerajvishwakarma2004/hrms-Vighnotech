import { useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchParamsUpdater } from './useSearchParamsUpdater';

function parseValue(raw, defaultValue) {
  if (raw === null) return defaultValue;
  if (typeof defaultValue === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
  }
  return raw;
}

/**
 * Keeps list filters in the URL query string so they survive reloads, are shareable,
 * and work with back/forward navigation.
 *
 * @param {Record<string, string|number>} defaults e.g. `{ page: 1, limit: 10, search: '', status: '' }`
 *   Number defaults are parsed back to numbers. Only keys present in `defaults` are read.
 * @returns {[Record<string, string|number>, (key: string, value: unknown) => void, () => void,
 *   (patch: object, options?: { replace?: boolean }) => void]}
 *   `[filters, setFilter, resetFilters, setFilters]` — changing any key other than `page` resets `page` to 1.
 *   Filter edits replace the history entry; page changes push one (so Back returns to the previous page)
 *   unless `replace: true` is passed, e.g. for automatic corrections.
 */
export function useUrlFilters(defaults) {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useSearchParamsUpdater();
  const defaultsRef = useRef(defaults);
  const queryString = searchParams.toString();

  const filters = useMemo(() => {
    const params = new URLSearchParams(queryString);
    return Object.fromEntries(
      Object.entries(defaultsRef.current).map(([key, defaultValue]) => [key, parseValue(params.get(key), defaultValue)]),
    );
  }, [queryString]);

  const setFilters = useCallback(
    (patch, { replace = !('page' in patch) } = {}) => {
      updateSearchParams(
        (params) => {
          Object.entries(patch).forEach(([key, value]) => {
            const isDefault = String(value ?? '') === String(defaultsRef.current[key] ?? '');
            if (value === undefined || value === null || value === '' || isDefault) params.delete(key);
            else params.set(key, String(value));
          });
          if (!('page' in patch)) params.delete('page');
        },
        { replace },
      );
    },
    [updateSearchParams],
  );

  const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters]);

  const resetFilters = useCallback(() => {
    updateSearchParams(
      (params) => Object.keys(defaultsRef.current).forEach((key) => params.delete(key)),
      { replace: true },
    );
  }, [updateSearchParams]);

  return [filters, setFilter, resetFilters, setFilters];
}

/** Counts filters that differ from their defaults, ignoring pagination keys. */
export function countActiveFilters(filters, defaults, ignore = ['page', 'limit', 'sortBy', 'sortOrder']) {
  return Object.keys(defaults).filter(
    (key) => !ignore.includes(key) && String(filters[key] ?? '') !== String(defaults[key] ?? ''),
  ).length;
}

/**
 * Next sort state for a header click: the active column flips its order; a new column starts
 * ascending when listed in `ascendingFirstKeys` (text columns: A→Z) and descending otherwise (newest/largest first).
 */
export function getNextSort({ sortBy, sortOrder }, nextSortBy, ascendingFirstKeys = []) {
  if (sortBy === nextSortBy) return { sortBy, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' };
  return { sortBy: nextSortBy, sortOrder: ascendingFirstKeys.includes(nextSortBy) ? 'asc' : 'desc' };
}
