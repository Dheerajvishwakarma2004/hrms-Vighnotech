import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { getStatusFillClass, getStatusStrokeClass, toPercent } from '../utils/chart';
import { formatCount } from '@/lib/format';

const VIEWBOX = 120;
const CENTER = VIEWBOX / 2;
const RADIUS = 48;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Surface gap between segments (viewBox units ≈ 2px at the rendered size). */
const SEGMENT_GAP = 1.5;

/** Converts counts into arc segments laid end to end around the ring. */
function buildSegments(items, total) {
  const visible = items.filter((item) => item.value > 0);
  const gap = visible.length > 1 ? SEGMENT_GAP : 0;
  let offset = 0;
  return visible.map((item) => {
    const length = (item.value / total) * CIRCUMFERENCE;
    const segment = { ...item, dash: Math.max(length - gap, 0.5), offset };
    offset += length;
    return segment;
  });
}

/**
 * SVG donut with an interactive legend. Hovering/focusing a segment or legend row highlights it and
 * shows its count in the centre; every legend row is a link to the matching filtered list.
 * @param {{ key: string, label: string, value: number, to: string }[]} items colored by status
 * @param {{ value: string, label: string }} summary centre text when nothing is highlighted
 */
export default function AttendanceDonut({ items, summary, label }) {
  const [activeKey, setActiveKey] = useState(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = buildSegments(items, total);
  const active = items.find((item) => item.key === activeKey);
  const clearActive = () => setActiveKey(null);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row md:flex-col xl:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          role="img"
          aria-label={`${label}: ${items.map((item) => `${item.label} ${item.value}`).join(', ')}`}
          className="h-full w-full -rotate-90"
        >
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
              strokeDashoffset={-segment.offset}
              className={cn(
                'cursor-pointer transition-opacity duration-200',
                getStatusStrokeClass(segment.key),
                activeKey && activeKey !== segment.key && 'opacity-25',
              )}
              onMouseEnter={() => setActiveKey(segment.key)}
              onMouseLeave={clearActive}
            >
              <title>{`${segment.label}: ${formatCount(segment.value)} (${toPercent(segment.value, total)}%)`}</title>
            </circle>
          ))}
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <span className="font-display text-2xl font-semibold text-slate-900">
            {active ? formatCount(active.value) : summary.value}
          </span>
          <span className="line-clamp-2 text-xs text-slate-500">
            {active ? `${active.label} · ${toPercent(active.value, total)}%` : summary.label}
          </span>
        </div>
      </div>

      <ul aria-label={`${label} legend`} className="grid w-full min-w-0 flex-1 gap-0.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.to}
              onMouseEnter={() => setActiveKey(item.key)}
              onMouseLeave={clearActive}
              onFocus={() => setActiveKey(item.key)}
              onBlur={clearActive}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                activeKey === item.key && 'bg-slate-100',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getStatusFillClass(item.key))}
              />
              <span className="min-w-0 flex-1 truncate text-slate-600">{item.label}</span>
              <span className="font-semibold tabular-nums text-slate-900">{formatCount(item.value)}</span>
              <span className="w-10 text-right text-xs tabular-nums text-slate-500">
                {toPercent(item.value, total)}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
