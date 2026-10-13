import { clsx } from 'clsx';

/** Joins conditional class names (strings, arrays, objects) into a single className string. */
export function cn(...inputs) {
  return clsx(inputs);
}
