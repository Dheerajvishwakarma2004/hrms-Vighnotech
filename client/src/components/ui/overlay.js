/**
 * Tiny overlay manager shared by Modal / drawers: a layer stack so only the top-most
 * overlay reacts to Esc, and a ref-counted body scroll lock.
 */
const layers = [];
let nextLayerId = 0;
let lockCount = 0;
let previousOverflow = '';

export function pushLayer() {
  nextLayerId += 1;
  layers.push(nextLayerId);
  return nextLayerId;
}

export function popLayer(id) {
  const index = layers.indexOf(id);
  if (index !== -1) layers.splice(index, 1);
}

export function isTopLayer(id) {
  return layers[layers.length - 1] === id;
}

export function lockBodyScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;
    if (lockCount === 0) document.body.style.overflow = previousOverflow;
  };
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.closest('[aria-hidden="true"]') && element.getClientRects().length > 0,
  );
}
