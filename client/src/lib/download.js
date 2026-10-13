import toast from 'react-hot-toast';
import { API_BASE_URL } from './constants';
import { getErrorMessage } from './errors';

function parseFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const encoded = contentDisposition.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Malformed encoding — fall back to the plain filename parameter below.
    }
  }
  const plain = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
  return plain ? plain[1].trim() : null;
}

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return getErrorMessage({ status: response.status, data: body });
  } catch {
    return response.status === 404 ? 'File not found' : `Download failed (HTTP ${response.status})`;
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads a protected file: fetches with the Bearer token, reads the filename from
 * `Content-Disposition`, and triggers a browser download. Shows a toast on failure.
 * @param {string} path API path relative to the API base, e.g. `/candidates/123/resume`
 * @param {string} [fallbackName] filename used when the server does not send one
 * @param {{ token?: string|null, onUnauthorized?: () => void }} [options]
 *   `onUnauthorized` runs on a 401 for an authenticated request (e.g. to end the expired session)
 * @returns {Promise<boolean>} whether the download succeeded
 */
export async function downloadFile(path, fallbackName = 'download', { token, onUnauthorized } = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      if (response.status === 401 && token && onUnauthorized) {
        onUnauthorized();
        return false;
      }
      throw new Error(await readErrorMessage(response));
    }

    const blob = await response.blob();
    saveBlob(blob, parseFilename(response.headers.get('Content-Disposition')) || fallbackName);
    return true;
  } catch (error) {
    const message =
      error instanceof TypeError ? getErrorMessage({ status: 'FETCH_ERROR' }) : getErrorMessage(error);
    toast.error(message);
    return false;
  }
}
