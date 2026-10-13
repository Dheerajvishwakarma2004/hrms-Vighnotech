import { getStatusColor } from '@/lib/colors';

/** Whole-number share of `part` in `total` (0 when total is 0). */
export function toPercent(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/**
 * Soft chart palette (teal / amber / rose / sky first, muted tones for the rest). Marks are always
 * paired with text labels and counts, so color is never the only signal. Full class strings keep
 * them visible to Tailwind.
 */
const CHART_COLORS = {
  gray: { fill: 'bg-slate-300', stroke: 'stroke-slate-300' },
  primary: { fill: 'bg-primary-400', stroke: 'stroke-primary-400' },
  blue: { fill: 'bg-sky-300', stroke: 'stroke-sky-300' },
  indigo: { fill: 'bg-indigo-300', stroke: 'stroke-indigo-300' },
  purple: { fill: 'bg-violet-300', stroke: 'stroke-violet-300' },
  green: { fill: 'bg-teal-500', stroke: 'stroke-teal-500' },
  teal: { fill: 'bg-cyan-400', stroke: 'stroke-cyan-400' },
  yellow: { fill: 'bg-amber-300', stroke: 'stroke-amber-300' },
  orange: { fill: 'bg-orange-300', stroke: 'stroke-orange-300' },
  red: { fill: 'bg-rose-300', stroke: 'stroke-rose-300' },
};

export function getStatusStrokeClass(status) {
  return CHART_COLORS[getStatusColor(status)].stroke;
}

export function getStatusFillClass(status) {
  return CHART_COLORS[getStatusColor(status)].fill;
}
