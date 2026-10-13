import { jest } from '@jest/globals';
import { startKeepAlive } from '../src/services/keepAlive.service.js';

const MINUTE = 60 * 1000;
const BASE_URL = 'https://hrms.example.com';

describe('keep-alive ping', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does nothing when no public URL is configured', () => {
    const fetchImpl = jest.fn();
    const stop = startKeepAlive({ baseUrl: undefined, fetchImpl });
    jest.advanceTimersByTime(60 * MINUTE);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(() => stop()).not.toThrow();
  });

  it('requests the public health URL once per interval, not immediately', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true });
    const stop = startKeepAlive({ baseUrl: BASE_URL, intervalMinutes: 10, fetchImpl });

    expect(fetchImpl).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(10 * MINUTE);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(`${BASE_URL}/api/health`);

    await jest.advanceTimersByTimeAsync(20 * MINUTE);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    stop();
  });

  it('keeps pinging after a failed request and never throws', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValue({ ok: true });
    const stop = startKeepAlive({ baseUrl: BASE_URL, intervalMinutes: 5, fetchImpl });

    await jest.advanceTimersByTimeAsync(15 * MINUTE);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledTimes(2);
    stop();
  });

  it('stops pinging once stopped', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true });
    const stop = startKeepAlive({ baseUrl: BASE_URL, intervalMinutes: 10, fetchImpl });
    stop();
    await jest.advanceTimersByTimeAsync(60 * MINUTE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
