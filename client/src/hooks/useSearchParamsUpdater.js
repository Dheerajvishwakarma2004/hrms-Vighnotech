import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Returns `update(mutate, { replace })`, which edits the query string of the CURRENT URL.
 *
 * `useSearchParams`' functional setter receives the params of the last *render*; navigations are
 * transitions, so two quick updates (e.g. clearing one filter and then picking another before the
 * page re-rendered) would make the second overwrite the first. Starting from `window.location.search`
 * (updated synchronously by the router's history) keeps every update.
 *
 * @returns {(mutate: (params: URLSearchParams) => void, options?: { replace?: boolean }) => void}
 */
export function useSearchParamsUpdater() {
  const navigate = useNavigate();

  return useCallback(
    (mutate, { replace = false } = {}) => {
      const params = new URLSearchParams(window.location.search);
      mutate(params);
      const search = params.toString();
      navigate({ search: search ? `?${search}` : '' }, { replace });
    },
    [navigate],
  );
}
