import { useCallback, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { logout } from '@/features/auth/authSlice';
import { downloadFile } from '@/lib/download';

/**
 * Wraps `downloadFile` with the session token and per-item loading state.
 * `download(path, fallbackName, key?)` — `key` (defaults to `path`) identifies the item for `isDownloading(key)`.
 * A 401 ends the session exactly like a 401 from any API request.
 */
export function useDownload() {
  const dispatch = useDispatch();
  const store = useStore();
  const [pending, setPending] = useState(() => new Set());

  const download = useCallback(
    async (path, fallbackName, key = path) => {
      setPending((prev) => new Set(prev).add(key));
      try {
        return await downloadFile(path, fallbackName, {
          token: store.getState().auth.token,
          onUnauthorized: () => dispatch(logout({ reason: 'expired' })),
        });
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [dispatch, store],
  );

  const isDownloading = useCallback((key) => pending.has(key), [pending]);

  return { download, isDownloading };
}
