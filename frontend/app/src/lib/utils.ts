import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// One dosha colour code for the whole app: Vata = air (blue), Pitta = fire (saffron), Kapha = earth (forest)
const PRAKRITI_TONES: Record<string, { badge: string; chart: string }> = {
  Vata: { badge: "bg-blue-100 text-blue-800", chart: "#3b82f6" },
  Pitta: { badge: "bg-saffron-200/60 text-saffron-700", chart: "#d68c45" },
  Kapha: { badge: "bg-forest-200/60 text-forest-900", chart: "#1b4332" },
  "Vata-Pitta": { badge: "bg-violet-100 text-violet-800", chart: "#8b5cf6" },
  "Vata-Kapha": { badge: "bg-cyan-100 text-cyan-800", chart: "#0891b2" },
  "Pitta-Kapha": { badge: "bg-pink-100 text-pink-800", chart: "#db2777" },
  Tridosha: { badge: "bg-sand-200 text-ink", chart: "#a5d0b9" },
}

export const prakritiBadge = (prakriti?: string) => (PRAKRITI_TONES[prakriti ?? ""] ?? PRAKRITI_TONES.Tridosha).badge
export const prakritiChart = (prakriti?: string) => (PRAKRITI_TONES[prakriti ?? ""] ?? PRAKRITI_TONES.Tridosha).chart

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-saffron-200/50 text-saffron-700",
  completed: "bg-forest-200/50 text-forest-900",
  cancelled: "bg-danger-soft text-danger",
}

export const statusBadge = (status?: string) => STATUS_BADGES[status ?? ""] ?? STATUS_BADGES.pending
