import { isAxiosError } from 'axios';

export const NETWORK_ERROR_MESSAGE =
  "We can't reach the server right now. It may still be waking up - please try again in a moment.";

/** Human-readable message for any thrown value, preferring the API's `{ message }` body. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (!err.response) return NETWORK_ERROR_MESSAGE;
    if (err.response.status === 429) return 'Too many requests. Please wait a moment and try again.';
    return fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
