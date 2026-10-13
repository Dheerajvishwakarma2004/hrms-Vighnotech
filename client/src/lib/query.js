/** Drops `undefined`, `null` and empty-string values so they are not sent as query params. */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

/** Builds an in-app link with pre-applied list filters, e.g. `/leaves?status=Pending`. Empty values are skipped. */
export function withQuery(path, params = {}) {
  const query = new URLSearchParams(cleanParams(params)).toString();
  return query ? `${path}?${query}` : path;
}
