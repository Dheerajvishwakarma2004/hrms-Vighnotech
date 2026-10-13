/**
 * Builds multipart FormData from a plain object. Files/Blobs are appended as-is,
 * `undefined`/`null` values are skipped, everything else is stringified.
 */
export function toFormData(values = {}) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) formData.append(key, value);
    else formData.append(key, String(value));
  });
  return formData;
}

/** "1.4 MB" style size label. */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
