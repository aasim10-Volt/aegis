"use client";

/**
 * PipelineStepper — AEGIS's signature element.
 * Renders the engine as a sequence: Verify → Dedupe → Match → Form → Monitor.
 * Order carries real meaning here (each stage trusts the previous one's output),
 * so the stepped/numbered treatment is earned, not decorative.
 *
 * <PipelineStepper current={2} />            // running, on "Match"
 * <PipelineStepper current={5} done />       // finished
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Stage {
  key: string;
  label: string;
  hint?: string;
}

const DEFAULT_STAGES: Stage[] = [
  { key: "verify", label: "Verify", hint: "Â = L × C" },
  { key: "dedupe", label: "Dedupe", hint: "cosine ≥ 0.75" },
  { key: "match", label: "Match", hint: "SPA" },
  { key: "form", label: "Form", hint: "maximin" },
  { key: "monitor", label: "Monitor", hint: "health + alerts" },
];

export interface PipelineStepperProps {
  stages?: Stage[];
  current: number;       // 1-based index of the active stage
  done?: boolean;        // all stages complete
  className?: string;
}

export function PipelineStepper({
  stages = DEFAULT_STAGES,
  current,
  done = false,
  className,
}: PipelineStepperProps) {
  const reduce = useReducedMotion();
  const total = stages.length;
  const activeIndex = done ? total : Math.max(1, Math.min(total, current));
  const progress = (Math.max(0, activeIndex - 1) / (total - 1)) * 100;

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-border/60 bg-card p-6 shadow-card",
        className,
      )}
    >
      <div className="relative mx-auto flex max-w-3xl items-start justify-between">
        {/* track */}
        <div className="absolute left-0 right-0 top-4 mx-5 h-0.5 rounded-full bg-border" />
        <motion.div
          className="absolute left-0 top-4 mx-5 h-0.5 rounded-full bg-primary"
          style={{ maxWidth: "calc(100% - 2.5rem)" }}
          initial={{ width: reduce ? `${progress}%` : 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduce ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {stages.map((stage, i) => {
          const idx = i + 1;
          const state =
            idx < activeIndex ? "done" : idx === activeIndex && !done ? "active" : done ? "done" : "todo";
          return (
            <div key={stage.key} className="relative z-10 flex w-full flex-col items-center gap-2">
              <motion.div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary bg-card text-primary",
                  state === "todo" && "border-border bg-card text-muted-foreground",
                )}
                initial={false}
                animate={
                  state === "active" && !reduce
                    ? { boxShadow: "0 0 0 5px color-mix(in oklch, var(--primary) 16%, transparent)" }
                    : { boxShadow: "0 0 0 0px transparent" }
                }
                transition={{ duration: 0.3 }}
              >
                {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : idx}
              </motion.div>
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {stage.label}
                </span>
                {stage.hint && (
                  <span className="nums mt-0.5 text-[0.625rem] text-muted-foreground">
                    {stage.hint}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
