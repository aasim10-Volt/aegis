"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Logo } from "@/components/aegis/logo";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FIELD } from "@/components/auth/auth-frame";
import { createClient } from "@/lib/supabase/client";

/** Skills-intake survey new students complete so AEGIS can describe their profile.
 *  Stored in the user's OWN auth metadata (presentational onboarding) — it is NOT
 *  written to the cohort tables or fed to the live allocation engine (that ingestion
 *  is the documented production path). The four disciplines mirror engine/config.py. */
const DISCIPLINES = [
  { key: "technical", label: "Technical / Architecture" },
  { key: "ux", label: "UX / Design" },
  { key: "management", label: "Project management" },
  { key: "communication", label: "Communication" },
] as const;

const LEVELS = [
  { v: 1, l: "1 — Novice" },
  { v: 2, l: "2 — Basic" },
  { v: 3, l: "3 — Competent" },
  { v: 4, l: "4 — Proficient" },
  { v: 5, l: "5 — Expert" },
];

type Skills = Record<string, number>;

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
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(48rem 28rem at 50% -8%, color-mix(in oklch, var(--primary) 14%, transparent), transparent)",
        }}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-12">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <Card className="p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Your skills profile</h1>
              <p className="text-sm text-muted-foreground">
                Rate yourself honestly — AEGIS weights claims against evidence and uses this to
                place you on a balanced team.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                className="rounded-xl border p-3 text-sm"
                style={{
                  borderColor: "color-mix(in oklch, var(--critical) 35%, transparent)",
                  backgroundColor: "color-mix(in oklch, var(--critical) 8%, transparent)",
                  color: "var(--critical)",
                }}
              >
                {error}
              </div>
            )}

            {DISCIPLINES.map((d) => (
              <div key={d.key}>
                <Label htmlFor={d.key}>{d.label}</Label>
                <select
                  id={d.key}
                  className={FIELD}
                  value={skills[d.key]}
                  onChange={(e) => setSkills((s) => ({ ...s, [d.key]: Number(e.target.value) }))}
                >
                  {LEVELS.map((lv) => (
                    <option key={lv.v} value={lv.v}>
                      {lv.l}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="capacity">Weekly availability (hrs)</Label>
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
                <Label htmlFor="preferredRole">Preferred role</Label>
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

            <Button type="submit" disabled={busy} className="mt-1 w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {busy ? "Saving…" : "Save & continue"}
            </Button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              You can update this anytime. <Link href="/dashboard" className="font-medium text-primary hover:underline">Skip for now</Link>
            </p>
          </form>
        </Card>
      </div>
    </main>
  );
}
