// Tracks API requests that take long enough to suggest a cold-starting backend (Render free tier sleeps).
type Listener = (waking: boolean) => void;

export const SLOW_REQUEST_MS = 4000;

let slowRequests = 0;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l(slowRequests > 0));

export function isServerWaking(): boolean {
  return slowRequests > 0;
}

export function subscribeServerWaking(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call when a request starts; call the returned function when it settles. */
export function startRequestTimer(thresholdMs = SLOW_REQUEST_MS): () => void {
  let flagged = false;
  const timer = setTimeout(() => {
    flagged = true;
    slowRequests += 1;
    emit();
  }, thresholdMs);
  return () => {
    clearTimeout(timer);
    if (flagged) {
      slowRequests -= 1;
      emit();
    }
  };
}
