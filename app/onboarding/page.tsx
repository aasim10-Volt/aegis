"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Loader2,
  Cpu,
  Palette,
  FolderKanban,
  MessageCircle,
} from "lucide-react";

import { Logo } from "@/components/aegis/logo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FIELD } from "@/components/auth/auth-frame";
import { createClient } from "@/lib/supabase/client";

/** Skills-intake survey new students complete so AEGIS can describe their profile.
 *  Stored in the user's OWN auth metadata (presentational onboarding) — it is NOT
 *  written to the cohort tables or fed to the live allocation engine (that ingestion
 *  is the documented production path). The four disciplines mirror engine/config.py. */

type LucideIcon = React.ComponentType<{ className?: string }>;

const DISCIPLINES: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "technical", label: "Technical / Architecture", Icon: Cpu },
  { key: "ux", label: "UX / Design", Icon: Palette },
  { key: "management", label: "Project management", Icon: FolderKanban },
  { key: "communication", label: "Communication", Icon: MessageCircle },
];

const LEVELS = [
  { v: 1, short: "Novice" },
  { v: 2, short: "Basic" },
  { v: 3, short: "Competent" },
  { v: 4, short: "Proficient" },
  { v: 5, short: "Expert" },
];

type Skills = Record<string, number>;

function SkillRater({
  disciplineKey,
  value,
  onChange,
}: {
  disciplineKey: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-labelledby={`${disciplineKey}-label`}
    >
      {LEVELS.map((lv) => {
        const active = value === lv.v;
        return (
          <button
            key={lv.v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${lv.v} - ${lv.short}`}
            onClick={() => onChange(lv.v)}
            className={[
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl border py-2.5",
              "transition-all duration-150 active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground",
            ].join(" ")}
          >
            <span className="text-sm font-semibold leading-none tabular-nums">
              {lv.v}
            </span>
            <span className="max-w-full truncate text-[9px] leading-none tracking-tight">
              {lv.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [skills, setSkills] = React.useState<Skills>({
    technical: 3,
    ux: 3,
    management: 3,
    communication: 3,
  });
  const [capacity, setCapacity] = React.useState("10");
  const [preferredRole, setPreferredRole] = React.useState("flexible");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Prefill if the student has answered before (read their own metadata).
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const m = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
      if (m.skills) setSkills((s) => ({ ...s, ...(m.skills as Skills) }));
      if (m.capacity_hours) setCapacity(String(m.capacity_hours));
      if (m.preferred_role) setPreferredRole(String(m.preferred_role));
    });
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Server route (service role) registers the student in the cohort + links the
    // auth user + sets skills_completed. It alone can write the RLS-protected tables.
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills,
        capacity_hours: Number(capacity) || 0,
        preferred_role: preferredRole,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Could not save your profile. Please try again.");
      setBusy(false);
      return;
    }
    // Hard navigation so the refreshed session (skills_completed, student_id) is read
    // fresh and the dashboard doesn't bounce back here.
    window.location.assign("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Atmospheric glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(48rem 28rem at 50% -8%, color-mix(in oklch, var(--primary) 14%, transparent), transparent)",
        }}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-12">
        {/* Logo */}
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>

        {/* Card — matches auth-frame pattern */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-border/60 bg-card p-8 shadow-card-lg"
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Your skills profile
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Rate yourself honestly. AEGIS weights claims against evidence to
                place you on a balanced team.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
            {error && (
              <div
                role="alert"
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "color-mix(in oklch, var(--critical) 35%, transparent)",
                  backgroundColor: "color-mix(in oklch, var(--critical) 8%, transparent)",
                  color: "var(--critical)",
                }}
              >
                {error}
              </div>
            )}

            {/* Skill raters */}
            <div className="flex flex-col gap-4">
              {DISCIPLINES.map((d) => (
                <div key={d.key}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <d.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      id={`${d.key}-label`}
                      className="text-sm font-medium text-foreground"
                    >
                      {d.label}
                    </span>
                  </div>
                  <SkillRater
                    disciplineKey={d.key}
                    value={skills[d.key]}
                    onChange={(v) =>
                      setSkills((s) => ({ ...s, [d.key]: v }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Section divider */}
            <div className="border-t border-border/50" />

            {/* Availability + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="capacity" className="mb-1.5 block text-sm">
                  Weekly availability (hrs)
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  max="40"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="preferredRole" className="mb-1.5 block text-sm">
                  Preferred role
                </Label>
                <select
                  id="preferredRole"
                  className={FIELD}
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                >
                  <option value="flexible">Flexible</option>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="design">Design</option>
                  <option value="pm">Project manager</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={busy} className="mt-1 w-full">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              {busy ? "Saving..." : "Save & continue"}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              You can update this anytime.{" "}
              <Link
                href="/dashboard"
                className="font-medium text-primary hover:underline"
              >
                Skip for now
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
