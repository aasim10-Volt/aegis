import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/format";

/** Each tone: a vivid hue (tint bg + dot) and a darker/lighter "ink" for AA-safe text. */
const TONE: Record<Tone, { hue: string; ink: string }> = {
  healthy: { hue: "var(--healthy)", ink: "var(--healthy-ink)" },
  at_risk: { hue: "var(--at-risk)", ink: "var(--at-risk-ink)" },
  critical: { hue: "var(--critical)", ink: "var(--critical-ink)" },
  info: { hue: "var(--info)", ink: "var(--info-ink)" },
  neutral: { hue: "var(--muted-foreground)", ink: "var(--muted-foreground)" },
};

/** Soft status pill — light tint background, AA-contrast ink text, optional vivid dot. */
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
  const { hue, ink } = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
      style={{ backgroundColor: `color-mix(in oklch, ${hue} 15%, transparent)`, color: ink }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hue }} />}
      {children}
    </span>
  );
}
