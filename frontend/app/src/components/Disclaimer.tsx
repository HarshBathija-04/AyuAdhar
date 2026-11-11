import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const MEDICAL_DISCLAIMER =
  'This app provides general Ayurvedic and nutrition education. It is not medical advice and does not replace a qualified clinician. Consult your doctor before changing medication or treatment, and seek emergency care for urgent symptoms.';

export default function Disclaimer({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-xl border border-saffron-200 bg-saffron-200/25 text-saffron-700',
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Not medical advice.</strong> {MEDICAL_DISCLAIMER}
      </span>
    </p>
  );
}
