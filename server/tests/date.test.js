import { jest } from '@jest/globals';
import { fromDateKey, todayDate, todayKey } from '../src/utils/date.js';

describe('IST "today"', () => {
  afterEach(() => jest.useRealTimers());

  it('is already the next day in IST when it is evening in UTC', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-12T20:00:00.000Z')); // 01:30 on 13 Oct in IST
    expect(todayKey()).toBe('2026-10-13');
    expect(todayDate().toISOString()).toBe('2026-10-13T00:00:00.000Z');
  });

  it('is still the same day in IST just before IST midnight', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-12T18:29:59.000Z')); // 23:59:59 on 12 Oct in IST
    expect(todayKey()).toBe('2026-10-12');
  });

  it('rolls over exactly at 00:00 IST (18:30 UTC)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-12T18:30:00.000Z'));
    expect(todayKey()).toBe('2026-10-13');
  });

  it('stores date-only values as UTC midnight of the calendar day', () => {
    expect(fromDateKey('2026-10-13').toISOString()).toBe('2026-10-13T00:00:00.000Z');
  });
});
