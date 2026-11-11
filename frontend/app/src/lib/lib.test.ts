import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getErrorMessage, NETWORK_ERROR_MESSAGE } from './errors';
import { isServerWaking, startRequestTimer, subscribeServerWaking } from './serverStatus';

const axiosError = (status?: number, data?: unknown) => {
  const config = { headers: new AxiosHeaders() };
  const response = status ? { status, statusText: '', headers: {}, config, data } : undefined;
  return new AxiosError('boom', 'ERR', config, undefined, response);
};

describe('getErrorMessage', () => {
  it('prefers the API message', () => {
    expect(getErrorMessage(axiosError(400, { message: 'age: too high' }))).toBe('age: too high');
  });
  it('explains network failures (cold start)', () => {
    expect(getErrorMessage(axiosError())).toBe(NETWORK_ERROR_MESSAGE);
  });
  it('handles rate limiting and plain errors', () => {
    expect(getErrorMessage(axiosError(429, {}))).toMatch(/Too many requests/);
    expect(getErrorMessage(new Error('plain'))).toBe('plain');
    expect(getErrorMessage('???', 'fallback')).toBe('fallback');
  });
});

describe('server waking tracker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('flags only slow requests and clears when they finish', () => {
    const events: boolean[] = [];
    const unsubscribe = subscribeServerWaking((w) => events.push(w));

    const fast = startRequestTimer(1000);
    vi.advanceTimersByTime(500);
    fast();
    expect(isServerWaking()).toBe(false);

    const slow = startRequestTimer(1000);
    vi.advanceTimersByTime(1500);
    expect(isServerWaking()).toBe(true);
    slow();
    expect(isServerWaking()).toBe(false);
    expect(events).toEqual([true, false]);
    unsubscribe();
  });
});
