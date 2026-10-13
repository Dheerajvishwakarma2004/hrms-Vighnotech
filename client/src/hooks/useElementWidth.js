import { useLayoutEffect, useState } from 'react';

/**
 * Tracks the content width of an element with a ResizeObserver.
 * Measured before paint, so layouts that depend on it never flash the wrong variant.
 *
 * @returns {[(node: HTMLElement|null) => void, number]} `[ref, width]` — attach `ref` to the element
 */
export function useElementWidth() {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!node) return undefined;
    const update = () => setWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, width];
}
