"use client";

import { AlertTriangle } from "lucide-react";

/** Visible fallback indicator. Render this (gated by useRun's `sample` flag)
 *  whenever the live API call failed and the bundled sample was swapped in, so a
 *  live outage is never silently presented as a successful live run. The fallback
 *  behaviour itself is unchanged — this only makes it impossible to miss. */
export function SampleDataBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm"
      style={{
        borderColor: "color-mix(in oklch, var(--at-risk) 40%, transparent)",
        backgroundColor: "color-mix(in oklch, var(--at-risk) 10%, transparent)",
        color: "var(--at-risk-ink)",
      }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        <b>Showing sample data:</b> the live API is unavailable, so these are illustrative
        seed numbers, not a live run.
      </span>
    </div>
  );
}
