/**
 * Semantic color tokens shared by Badge, StatusBadge, Avatar, calendar dots, stat cards, etc.
 * Full class strings are listed so Tailwind can detect them.
 */
export const COLOR_CLASSES = {
  gray: {
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/15',
    dot: 'bg-slate-400',
    soft: 'bg-slate-100 text-slate-600',
  },
  primary: {
    badge: 'bg-primary-50 text-primary-700 ring-primary-600/15',
    dot: 'bg-primary-500',
    soft: 'bg-primary-100 text-primary-700',
  },
  blue: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    dot: 'bg-sky-500',
    soft: 'bg-sky-100 text-sky-700',
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
    dot: 'bg-indigo-500',
    soft: 'bg-indigo-100 text-indigo-700',
  },
  purple: {
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    dot: 'bg-violet-500',
    soft: 'bg-violet-100 text-violet-700',
  },
  green: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-100 text-emerald-700',
  },
  teal: {
    badge: 'bg-teal-50 text-teal-700 ring-teal-600/15',
    dot: 'bg-teal-500',
    soft: 'bg-teal-100 text-teal-700',
  },
  yellow: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    dot: 'bg-amber-500',
    soft: 'bg-amber-100 text-amber-800',
  },
  orange: {
    badge: 'bg-orange-50 text-orange-700 ring-orange-600/15',
    dot: 'bg-orange-500',
    soft: 'bg-orange-100 text-orange-700',
  },
  red: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    dot: 'bg-rose-500',
    soft: 'bg-rose-100 text-rose-700',
  },
};

/** Every status value from all server enums → semantic color. */
const STATUS_COLORS = {
  // Candidate
  New: 'blue',
  Scheduled: 'indigo',
  Ongoing: 'yellow',
  Selected: 'green',
  Rejected: 'red',
  // Employee
  Active: 'green',
  Inactive: 'gray',
  // Attendance
  Present: 'green',
  Absent: 'red',
  'Half Day': 'orange',
  'Work From Home': 'teal',
  'On Leave': 'purple',
  'Not Marked': 'gray',
  // Leave
  Pending: 'yellow',
  Approved: 'green',
};

export function getStatusColor(status) {
  return STATUS_COLORS[status] ?? 'gray';
}

const HASH_PALETTE = ['primary', 'blue', 'indigo', 'purple', 'green', 'teal', 'orange', 'red', 'yellow'];

/** Deterministic color for a string (avatar initials, department chips, ...). */
export function getHashColor(value = '') {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return HASH_PALETTE[Math.abs(hash) % HASH_PALETTE.length];
}
