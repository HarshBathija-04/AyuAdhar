import { Leaf } from 'lucide-react';

/** Brand mark used on the landing page, auth pages and the app sidebar. */
export default function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="rounded-xl bg-gradient-to-br from-forest-950 to-forest-900 p-2 shadow-md shadow-forest-900/20">
        <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <span
        className={`font-display text-xl font-bold tracking-tight ${inverted ? 'text-white' : 'text-forest-950'}`}
      >
        AyuAahar
      </span>
    </span>
  );
}
