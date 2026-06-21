"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Copy,
  Inbox,
  Play,
  Loader2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { EvidenceBar } from "@/components/aegis/evidence-bar";
import { HealthRing } from "@/components/aegis/health-ring";
import { PipelineStepper } from "@/components/aegis/pipeline-stepper";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import {
  type AlertView,
  type RunResponse,
  type StudentProfile,
  type TeamView,
  runPipeline,
} from "@/lib/api";
import {
  BAND_LABEL,
  bandTone,
  describeAlert,
  makeLookups,
  severityTone,
  SEVERITY_LABEL,
  titleCase,
  utilisationPct,
} from "@/lib/format";

type Status = "idle" | "running" | "done" | "error";
type Lookups = ReturnType<typeof makeLookups>;

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const asConfidence = (c: number): 1 | 0.8 | 0.6 | 0.5 =>
  near(c, 1) ? 1 : near(c, 0.8) ? 0.8 : near(c, 0.5) ? 0.5 : 0.6;

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
});

// ── summary stat tile ─────────────────────────────────────────────────────────
function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{value}</p>
        {hint && <p className="text-[0.7rem] text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}

// ── team card ─────────────────────────────────────────────────────────────────
function TeamCard({ team }: { team: TeamView }) {
  const tone = bandTone(team.band);
  const color = `var(--${team.band === "at_risk" ? "at-risk" : team.band})`;
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            Team
          </p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-foreground">
            {team.project_title}
          </h3>
          <div className="mt-2">
            <StatusBadge tone={tone} dot>
              {BAND_LABEL[team.band]}
            </StatusBadge>
          </div>
        </div>
        <HealthRing value={team.health_score} size={86} strokeWidth={9} showBand={false} />
      </div>

      <div className="h-px bg-border/70" />

      <ul className="flex flex-col gap-2">
        {team.members.map((m) => (
          <li key={m.student_id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span
                className="h-6 w-6 shrink-0 rounded-full"
                style={{ background: `color-mix(in oklch, ${color} 22%, var(--secondary))` }}
              />
              {m.name}
            </span>
            <span
              className={m.overloaded ? "text-xs font-semibold" : "text-xs text-muted-foreground"}
              style={m.overloaded ? { color: "var(--at-risk)" } : undefined}
            >
              {utilisationPct(m.utilisation)}
              {m.overloaded ? " · over" : ""}
            </span>
          </li>
        ))}
      </ul>

      {team.unallocated_hours > 0 && (
        <p className="flex items-center gap-1.5 rounded-xl bg-[color-mix(in_oklch,var(--at-risk)_10%,transparent)] px-3 py-2 text-xs text-[var(--at-risk)]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {team.unallocated_hours}h beyond safe capacity — rebalance suggested
        </p>
      )}
    </Card>
  );
}

// ── evidence (Dunning-Kruger) ───────────────────────────────────────────────────
function EvidencePanel({ student }: { student: StudentProfile }) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Evidence-weighted profile</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{student.name}</span> — {student.rationale}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {student.skills.map((s) => (
          <EvidenceBar
            key={s.discipline}
            discipline={titleCase(s.discipline)}
            declared={s.declared}
            adjusted={s.adjusted}
            confidence={s.corrected ? 0.5 : asConfidence(s.confidence)}
          />
        ))}
      </div>
    </Card>
  );
}

// ── conflict detection ──────────────────────────────────────────────────────────
function ConflictPanel({ data }: { data: RunResponse }) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <h3 className="text-base font-semibold text-foreground">Conflicts &amp; exceptions</h3>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Copy className="h-4 w-4 text-muted-foreground" /> Overlapping proposals
        </p>
        {data.duplicate_flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">None flagged for review.</p>
        ) : (
          data.duplicate_flags.map((d) => (
            <div
              key={`${d.project_a}-${d.project_b}`}
              className="flex items-center justify-between rounded-xl bg-secondary/60 px-3.5 py-2.5"
            >
              <span className="text-sm text-foreground">Two proposals overlap</span>
              <StatusBadge tone="at_risk">{Math.round(d.similarity * 100)}% match</StatusBadge>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border/70 pt-4">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserRound className="h-4 w-4 text-muted-foreground" /> Needs faculty review
        </p>
        <p className="text-sm text-muted-foreground">
          {data.exception_pool.length === 0
            ? "Every student was placed — nothing pending."
            : `${data.exception_pool.length} student(s) awaiting manual placement.`}
        </p>
      </div>
    </Card>
  );
}

// ── alert inbox (right rail) ────────────────────────────────────────────────────
function AlertRow({ alert, lookups }: { alert: AlertView; lookups: Lookups }) {
  const tone = severityTone(alert.severity);
  const { title, context } = describeAlert(alert, lookups);
  return (
    <motion.div {...fade()} className="rounded-2xl border border-border/60 bg-card p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <StatusBadge tone={tone} dot>
          {SEVERITY_LABEL[alert.severity]}
        </StatusBadge>
      </div>
      {context && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{context}</p>}
    </motion.div>
  );
}

function AlertInbox({ alerts, lookups }: { alerts: AlertView[]; lookups: Lookups }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Inbox className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Attention needed</h2>
        <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {alerts.length}
        </span>
      </div>
      {alerts.length === 0 ? (
        <Card className="p-5 text-sm text-muted-foreground">All clear — no alerts.</Card>
      ) : (
        alerts.map((a, i) => <AlertRow key={`${a.trigger_type}-${i}`} alert={a} lookups={lookups} />)
      )}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter();
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

  const lookups = React.useMemo(
    () => (data ? makeLookups(data.student_profiles, data.teams) : null),
    [data],
  );
  const spotlight = data?.student_profiles.find((p) => p.skills.some((s) => s.corrected));
  const bandCount = (b: string) => data?.teams.filter((t) => t.band === b).length ?? 0;

  return (
    <AppShell
      active="overview"
      onNavigate={(key) => router.push(key === "settings" ? "/admin" : "/")}
      rail={data && lookups ? <AlertInbox alerts={data.alerts} lookups={lookups} /> : undefined}
    >
      <div className="flex flex-col gap-6">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Allocation overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Evidence-weighted scoring, fair team formation, and gentle engagement monitoring.
            </p>
          </div>
          <button
            onClick={runAllocation}
            disabled={status === "running"}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg disabled:translate-y-0 disabled:opacity-60"
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
          <Card className="border-[color-mix(in_oklch,var(--critical)_35%,transparent)] p-4 text-sm text-[var(--critical)]">
            {error}
          </Card>
        )}

        {status === "idle" && (
          <Card className="border-dashed bg-secondary/30 p-12 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Press <span className="font-semibold text-foreground">Run allocation</span> to form
              teams and surface anything that needs attention.
            </p>
          </Card>
        )}

        {data && lookups && (
          <>
            {/* summary stats */}
            <motion.div {...fade(0)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile icon={Users} label="Teams formed" value={data.teams.length} />
              <StatTile
                icon={ShieldCheck}
                label="Healthy"
                value={bandCount("healthy")}
                hint="score ≥ 75"
              />
              <StatTile
                icon={AlertTriangle}
                label="Need a look"
                value={bandCount("at_risk") + bandCount("critical")}
                hint="at risk or critical"
              />
              <StatTile icon={Inbox} label="Open alerts" value={data.alerts.length} />
            </motion.div>

            {/* teams */}
            <motion.div {...fade(1)} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.teams.map((t) => (
                <TeamCard key={t.team_id} team={t} />
              ))}
            </motion.div>

            {/* evidence + conflicts */}
            <motion.div {...fade(2)} className="grid gap-4 lg:grid-cols-2">
              {spotlight ? (
                <EvidencePanel student={spotlight} />
              ) : (
                <Card className="flex items-center p-6 text-sm text-muted-foreground">
                  No evidence corrections were needed this run.
                </Card>
              )}
              <ConflictPanel data={data} />
            </motion.div>

            {/* alerts inline on smaller screens (rail hidden < xl) */}
            <motion.div {...fade(3)} className="xl:hidden">
              <AlertInbox alerts={data.alerts} lookups={lookups} />
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
