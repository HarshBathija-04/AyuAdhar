import { useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { isServerWaking, subscribeServerWaking } from '@/lib/serverStatus';

/** Friendly notice while the free-tier backend cold starts (shown only for slow requests). */
export default function WakeUpBanner() {
  const waking = useSyncExternalStore(subscribeServerWaking, isServerWaking, () => false);
  if (!waking) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-2xl bg-forest-950 px-4 py-3 text-sm text-white shadow-lift"
    >
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      <p>
        <span className="font-semibold">Waking up the server...</span> The demo backend sleeps when idle, so the
        first request can take up to a minute. Thanks for your patience.
      </p>
    </div>
  );
}
