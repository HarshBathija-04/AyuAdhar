/** Layout-shaped placeholder shown while a page's data loads (avoids a blank spinner screen). */
export default function PageSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-10" role="status" aria-label={label}>
      <div className="h-9 w-56 max-w-full animate-pulse rounded-xl bg-sand-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/80 shadow-soft" />
        ))}
      </div>
      <div className="space-y-3 rounded-3xl bg-white/80 p-5 shadow-soft">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-sand-100" />
        ))}
      </div>
    </div>
  );
}
