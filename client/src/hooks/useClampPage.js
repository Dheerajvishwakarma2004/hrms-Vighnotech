import { useEffect } from 'react';

/**
 * Steps back to the last page when the current page is past the end — e.g. after deleting the last row
 * of the last page, a status change removing rows from a filtered list, or a stale shared `?page=9` link.
 *
 * Pass the pagination `meta` of the CURRENT arguments (RTK Query `currentData`, not `data`): stale meta
 * from the previous page would re-trigger the correction right after a Back navigation. The correction
 * replaces the history entry so it never traps the Back button.
 *
 * @param {{ totalPages: number }|undefined} meta
 * @param {number} page current page from the URL
 * @param {(patch: object, options?: { replace?: boolean }) => void} setFilters from `useUrlFilters`
 */
export function useClampPage(meta, page, setFilters) {
  const totalPages = meta?.totalPages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setFilters({ page: totalPages }, { replace: true });
  }, [totalPages, page, setFilters]);
}
