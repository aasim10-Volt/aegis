"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Copy, Play, ShieldAlert, UserX, Loader2 } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { EvidenceBar } from "@/components/aegis/evidence-bar";
import { HealthRing } from "@/components/aegis/health-ring";
import { PipelineStepper } from "@/components/aegis/pipeline-stepper";
import {
  type AlertView,
  type RunResponse,
  type StudentProfile,
  type TeamView,
  runPipeline,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "idle" | "running" | "done" | "error";

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--critical)",
  WARNING: "var(--at-risk)",
  INFO: "var(--info)",
};

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

// EvidenceBar's prop is a literal union; bucket with tolerance so float drift can't
// silently mis-label. The amber "corrected" state is driven by the server's flag, not this.
const asConfidence = (c: number): 1 | 0.8 | 0.6 | 0.5 =>
  near(c, 1) ? 1 : near(c, 0.8) ? 0.8 : near(c, 0.5) ? 0.5 : 0.6;

function AlertRow({ alert }: { alert: AlertView }) {
  const color = SEV_COLOR[alert.severity] ?? "var(--muted-foreground)";
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
      <span
        className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[0.625rem] font-semibold"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
      >
        {alert.severity}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{alert.detail}</p>
        <p className="nums mt-0.5 text-[0.6875rem] text-muted-foreground">
          {alert.trigger_type}
          {alert.team_id ? ` · ${alert.team_id}` : ""}
        </p>
      </div>
    </div>
  );
}

function AlertInbox({ alerts }: { alerts: AlertView[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Alert inbox</h2>
        <span className="nums ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {alerts.length}
        </span>
      </div>
      {alerts.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">No alerts.</p>
      ) : (
        alerts.map((a, i) => <AlertRow key={`${a.trigger_type}-${i}`} alert={a} />)
      )}
    </div>
  );
}

function TeamCard({ team }: { team: TeamView }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.25rem] bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="nums text-xs text-muted-foreground">{team.project_id}</p>
          <h3 className="truncate text-base font-semibold text-foreground">{team.project_title}</h3>
        </div>
        <HealthRing value={team.health_score} size={92} strokeWidth={9} />
      </div>
      <ul className="flex flex-col gap-1.5">
        {team.members.map((m) => (
          <li key={m.student_id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{m.name}</span>
            <span
              className={cn(
                "nums text-xs",
                m.overloaded ? "font-semibold text-[var(--at-risk)]" : "text-muted-foreground",
              )}
            >
              U {m.utilisation?.toFixed(2) ?? "—"}
              {m.overloaded ? " ⚠" : ""}
            </span>
          </li>
        ))}
      </ul>
      {team.unallocated_hours > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--at-risk)]">
          <AlertTriangle className="h-3.5 w-3.5" />
          {team.unallocated_hours}h shed by the U ≤ 1.2 overload guard
        </p>
      )}
    </div>
  );
}

function DunningKruger({ student }: { student: StudentProfile }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.25rem] bg-card p-5 shadow-card">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Evidence correction · {student.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{student.rationale}</p>
      </div>
      <div className="flex flex-col gap-3">
        {student.skills.map((s) => (
          <EvidenceBar
            key={s.discipline}
            discipline={s.discipline}
            declared={s.declared}
            adjusted={s.adjusted}
            // amber chip is driven by the server's authoritative `corrected` flag,
            // mapped onto the component's C=0.5 contract — never by float guesswork.
            confidence={s.corrected ? 0.5 : asConfidence(s.confidence)}
          />
        ))}
      </div>
    </div>
  );
}

function ConflictPanel({ data }: { data: RunResponse }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.25rem] bg-card p-5 shadow-card">
      <h3 className="text-base font-semibold text-foreground">Conflict detection</h3>
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Copy className="h-4 w-4 text-muted-foreground" /> Duplicate projects
        </p>
        {data.duplicate_flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">None flagged.</p>
        ) : (
          data.duplicate_flags.map((d) => (
            <p key={`${d.project_a}-${d.project_b}`} className="nums text-sm text-foreground">
              {d.project_a} ↔ {d.project_b} · {(d.similarity * 100).toFixed(0)}% similar
            </p>
          ))
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserX className="h-4 w-4 text-muted-foreground" /> Exception pool
        </p>
        <p className="text-sm text-muted-foreground">
          {data.exception_pool.length === 0
            ? "Every student placed — pool empty."
            : data.exception_pool.join(", ")}
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [stage, setStage] = React.useState(1);
  const [data, setData] = React.useState<RunResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runAllocation = React.useCallback(async () => {
    setStatus("running");
    setError(null);
    setStage(1);
    const ticker = setInterval(() => setStage((s) => Math.min(s + 1, 5)), 450);
    try {
      const result = await runPipeline();
      clearInterval(ticker);
      setStage(5);
      setData(result);
      setStatus("done");
    } catch (e) {
      clearInterval(ticker);
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  // Only a genuinely corrected student — no silent fallback to an uncorrected profile.
  const spotlight = data?.student_profiles.find((p) => p.skills.some((s) => s.corrected));

  return (
    <AppShell active="overview" rail={data ? <AlertInbox alerts={data.alerts} /> : undefined}>
      <div className="flex flex-col gap-6">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Allocation run</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Evidence-weighted scoring → SPA matching → maximin teams → consented monitoring.
            </p>
          </div>
          <button
            onClick={runAllocation}
            disabled={status === "running"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {status === "running" ? "Running…" : "Run allocation"}
          </button>
        </div>

        <PipelineStepper current={stage} done={status === "done"} />

        {status === "error" && (
          <div className="rounded-xl border border-[var(--critical)] bg-[color-mix(in_oklch,var(--critical)_8%,transparent)] p-4 text-sm text-[var(--critical)]">
            {error}
          </div>
        )}

        {status === "idle" && (
          <div className="rounded-[1.25rem] border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Press <span className="font-semibold text-foreground">Run allocation</span> to execute
              the engine on the seed cohort.
            </p>
          </div>
        )}

        {data && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {data.teams.map((t) => (
                <TeamCard key={t.team_id} team={t} />
              ))}
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-2">
              {spotlight ? (
                <DunningKruger student={spotlight} />
              ) : (
                <div className="flex items-center rounded-[1.25rem] bg-card p-5 text-sm text-muted-foreground shadow-card">
                  No evidence corrections fired this run.
                </div>
              )}
              <ConflictPanel data={data} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
