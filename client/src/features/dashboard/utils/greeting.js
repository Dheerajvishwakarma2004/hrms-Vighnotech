import { toAppZone } from '@/lib/date';

/** Time-of-day greeting for the IST clock. */
export function getGreeting(now = new Date()) {
  const hour = toAppZone(now).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getFirstName(fullName = '') {
  return fullName.trim().split(/\s+/)[0] ?? '';
}
