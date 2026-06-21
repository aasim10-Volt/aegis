import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/format";

const TONE_VAR: Record<Tone, string> = {
  healthy: "var(--healthy)",
  at_risk: "var(--at-risk)",
  critical: "var(--critical)",
  info: "var(--info)",
  neutral: "var(--muted-foreground)",
};

/** Soft pastel status pill — tint background + saturated text, with an optional dot. */
export function StatusBadge({
  tone,
  dot = false,
  className,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const color = TONE_VAR[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
      style={{ backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </span>
  );
}
