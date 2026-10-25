import { SignalHigh, SignalLow, SignalMedium } from "lucide-react";

const map = {
  low: { Icon: SignalLow, tone: "text-muted-foreground" },
  medium: { Icon: SignalMedium, tone: "text-warning" },
  high: { Icon: SignalHigh, tone: "text-destructive" },
} as const;

export function PriorityIcon({ priority, className = "h-4 w-4" }: { priority: string; className?: string }) {
  const p = map[(priority as keyof typeof map)] ?? map.medium;
  return <p.Icon className={`${className} shrink-0 ${p.tone}`} aria-hidden="true" />;
}
