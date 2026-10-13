const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Turns any error shape (RTK Query FetchBaseQueryError, SerializedError, server envelope, Error, string)
 * into a human-readable message.
 */
export function getErrorMessage(error, fallback = DEFAULT_MESSAGE) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  switch (error.status) {
    case 'FETCH_ERROR':
      return 'Network error — is the server running?';
    case 'PARSING_ERROR':
      return error.originalStatus >= 500
        ? 'The server is unavailable right now. Please try again shortly.'
        : 'Received an unexpected response from the server.';
    case 'TIMEOUT_ERROR':
      return 'The request timed out. Please try again.';
    default:
      break;
  }

  if (typeof error.data?.message === 'string' && error.data.message) return error.data.message;
  if (typeof error.message === 'string' && error.message) return error.message;
  return fallback;
}

/** Upload rejections (too large / wrong type) that belong on the file input even without a field name. */
const FILE_ERROR_STATUSES = [413, 415];

/** Field-level errors from the server envelope: `[{ field, message }]`. */
function getFieldErrors(error) {
  const errors = error?.data?.errors;
  return Array.isArray(errors) ? errors.filter((item) => item && item.field && item.message) : [];
}

/**
 * Maps server field errors onto react-hook-form fields.
 * @param {unknown} error RTK Query error
 * @param {Function} setError react-hook-form `setError`
 * @param {{ fieldMap?: Record<string,string>, fields?: string[], fileField?: string }} [options]
 *   `fieldMap` renames server fields to form fields; `fields` restricts mapping to known form fields;
 *   `fileField` receives 413/415 upload errors (which carry no field name).
 * @returns {boolean} true when at least one field error was applied
 */
export function applyServerErrors(error, setError, { fieldMap = {}, fields, fileField } = {}) {
  let applied = 0;
  getFieldErrors(error).forEach(({ field, message }) => {
    const name = fieldMap[field] ?? field;
    if (fields && !fields.includes(name)) return;
    setError(name, { type: 'server', message }, { shouldFocus: applied === 0 });
    applied += 1;
  });
  if (applied === 0 && fileField && FILE_ERROR_STATUSES.includes(error?.status)) {
    setError(fileField, { type: 'server', message: getErrorMessage(error) }, { shouldFocus: true });
    applied += 1;
  }
  return applied > 0;
}
