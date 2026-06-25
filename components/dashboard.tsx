"use client";

/** Reusable dashboard pieces shared by Overview / Teams / Alerts / Pipeline. */

import * as React from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertTriangle, ChevronDown, Copy, Inbox, MessageSquare, UserRound } from "lucide-react";

import { ChatPanel } from "@/components/aegis/chat-panel";
import { EvidenceBar } from "@/components/aegis/evidence-bar";
import { HealthRing } from "@/components/aegis/health-ring";
import { OpenWorkspaceButton } from "@/components/aegis/open-workspace-button";
import { useUser } from "@/components/auth/user-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { CardZoom } from "@/components/ui/card-zoom";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlertView, RunResponse, StudentProfile, TeamView } from "@/lib/api";
import { type makeLookups, titleCase, utilisationPct } from "@/lib/format";
import { HEALTH_COMPONENT, RECOMMENDATION, band, friendlyAlert } from "@/lib/labels";

export type Lookups = ReturnType<typeof makeLookups>;

// ── motion ────────────────────────────────────────────────────────────────────
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};
// Entrance reveal: SLIDE ONLY — never animate opacity, so content can never freeze
// invisible if the animation is gated by tab-focus/viewport. Visible by default;
// the slide is pure enhancement. Reduced-motion is handled globally (globals.css).
export const rise: Variants = {
  hidden: { y: 12 },
  show: { y: 0, transition: { duration: 0.45, ease: EASE } },
};

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const asConfidence = (c: number): 1 | 0.8 | 0.6 | 0.5 =>
  near(c, 1) ? 1 : near(c, 0.8) ? 0.8 : near(c, 0.5) ? 0.5 : 0.6;

function workloadPct(value: number | null | undefined): string {
  if (value == null) return "No data";
  const pct = Math.round(value * 100);
  return pct > 100 ? `${pct}% relative` : `${pct}%`;
}

function hasStampedWorkload(team: TeamView): boolean {
  const values = team.members.map((m) => m.utilisation).filter((v): v is number => v != null);
  return values.length > 1 && values.every((v) => near(v, values[0]));
}

function supabaseTeamId(teamId: string): string {
  return teamId.startsWith("T::") ? teamId.slice(3) : teamId;
}

function TeamWorkloadSummary({ team }: { team: TeamView }) {
  const values = team.members.map((m) => m.utilisation).filter((v): v is number => v != null);
  if (values.length === 0) return null;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const capped = Math.min(100, Math.max(0, average * 100));
  const overCapacity = average > 1;

  return (
    <div className="rounded-2xl bg-secondary/55 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">Relative workload</span>
        <span className="tnum font-semibold text-foreground">{workloadPct(average)}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${capped}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {overCapacity
          ? "Team demand is above the nominal baseline; shown as a team metric."
          : "Shown once because the live allocation reports this at team level."}
      </p>
    </div>
  );
}

// ── summary tile ──────────────────────────────────────────────────────────────
export function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Inbox;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4 p-6 transition-shadow hover:shadow-card-lg">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

// ── team card (hover for the full breakdown) ─────────────────────────────────
function memberRight(m: TeamView["members"][number], showWorkload: boolean) {
  return m.overloaded ? (
    <span className="shrink-0 text-xs font-medium" style={{ color: "var(--at-risk-ink)" }}>
      Over capacity
    </span>
  ) : !showWorkload ? null : (
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
      {utilisationPct(m.utilisation)}
    </span>
  );
}

function MemberRow({
  member,
  showWorkload,
}: {
  member: TeamView["members"][number];
  showWorkload: boolean;
}) {
  const right = memberRight(member, showWorkload);
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-foreground">{member.name}</span>
      {right}
    </div>
  );
}

function TeamCardZoom({ team }: { team: TeamView }) {
  const status = band(team.band);
  const components = Object.entries(team.components ?? {});
  const needsBalancing = team.unallocated_hours > 0 || team.members.some((m) => m.overloaded);
  const stampedWorkload = hasStampedWorkload(team);
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-tight text-foreground">{team.project_title}</h3>
          <div className="mt-2">
            <StatusBadge tone={status.tone} dot>
              {status.label}
            </StatusBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Team health {Math.round(team.health_score)} of 100.
          </p>
        </div>
        <HealthRing value={team.health_score} size={104} strokeWidth={11} showBand={false} />
      </div>

      {components.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {components.map(([key, value]) => {
            const pct = Math.min(100, Math.max(0, value * 100));
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{HEALTH_COMPONENT[key] ?? key}</span>
                  <span className="tabular-nums text-foreground">{Math.round(pct)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {stampedWorkload && <TeamWorkloadSummary team={team} />}

      <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
        <p className="text-xs font-medium text-muted-foreground">Members</p>
        {team.members.map((m) => (
          <MemberRow key={m.student_id} member={m} showWorkload={!stampedWorkload} />
        ))}
      </div>

      {needsBalancing && (
        <p
          className="flex items-center gap-1.5 rounded-xl bg-[color-mix(in_oklch,var(--at-risk)_12%,transparent)] px-3 py-2 text-xs"
          style={{ color: "var(--at-risk-ink)" }}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {RECOMMENDATION.overload}
          {team.unallocated_hours > 0 ? ` · ${Math.round(team.unallocated_hours)} h unassigned` : ""}
        </p>
      )}
    </Card>
  );
}

export function TeamCard({ team }: { team: TeamView }) {
  const [chatOpen, setChatOpen] = React.useState(false);
  const { user } = useUser();
  const status = band(team.band);
  const needsBalancing = team.unallocated_hours > 0 || team.members.some((m) => m.overloaded);
  const stampedWorkload = hasStampedWorkload(team);
  const summary = (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{team.project_title}</h3>
          <div className="mt-2">
            <StatusBadge tone={status.tone} dot>
              {status.label}
            </StatusBadge>
          </div>
        </div>
        <HealthRing value={team.health_score} size={84} strokeWidth={9} showBand={false} />
      </div>

      <div className="h-px bg-border/60" />

      {stampedWorkload && <TeamWorkloadSummary team={team} />}

      <ul className="flex flex-col gap-2.5">
        {team.members.map((m) => (
          <li key={m.student_id}>
            <MemberRow member={m} showWorkload={!stampedWorkload} />
          </li>
        ))}
      </ul>

      {user && (
        <>
          <button
            type="button"
            onClick={() => setChatOpen((open) => !open)}
            className="mt-2 flex w-full cursor-pointer items-center justify-between border-t border-border pt-2 text-muted-foreground"
          >
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <MessageSquare className="h-[13px] w-[13px]" />
              Team chat
            </span>
            <motion.span animate={{ rotate: chatOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-[13px] w-[13px]" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {chatOpen && (
              <motion.div
                key="chat"
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 1 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ paddingTop: 8 }}>
                  <ChatPanel
                    teamId={supabaseTeamId(team.team_id)}
                    currentUserId={user.id}
                    currentUserName={user.name || user.email}
                    isReadOnly={true}
                    messageLimit={20}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <OpenWorkspaceButton variant="link" className="self-end" />

      {needsBalancing && (
        <p
          className="flex items-center gap-1.5 rounded-xl bg-[color-mix(in_oklch,var(--at-risk)_12%,transparent)] px-3 py-2 text-xs"
          style={{ color: "var(--at-risk-ink)" }}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {RECOMMENDATION.overload}
        </p>
      )}
    </Card>
  );
  return <CardZoom preview={<TeamCardZoom team={team} />}>{summary}</CardZoom>;
}

// ── skill check (evidence-weighted, C=0.5 in amber) ──────────────────────────
export function SkillCheck({ student }: { student: StudentProfile }) {
  const adjusted = student.skills.some((s) => s.corrected);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill check · {student.name}</CardTitle>
        <CardDescription>
          {adjusted
            ? "One self-reported skill was adjusted to match the evidence on record."
            : "Skills checked against the evidence on record."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {student.skills.map((s) => (
          <EvidenceBar
            key={s.discipline}
            discipline={titleCase(s.discipline)}
            declared={s.declared}
            adjusted={s.adjusted}
            confidence={s.corrected ? 0.5 : asConfidence(s.confidence)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ── things to review (duplicate proposals + exceptions) ──────────────────────
export function ReviewPanel({ data, lookups }: { data: RunResponse; lookups: Lookups }) {
  const dup = data.duplicate_flags[0];
  const titleA = dup ? lookups.projectTitle(dup.project_a) : null;
  const titleB = dup ? lookups.projectTitle(dup.project_b) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Things to review</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <Copy className="h-4 w-4 text-muted-foreground" /> Similar project ideas
          </span>
        {dup ? (
          <div className="rounded-2xl bg-[color-mix(in_oklch,var(--at-risk)_11%,transparent)] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: "var(--at-risk-ink)" }}>
                Two proposals overlap
              </span>
              <StatusBadge tone="at_risk"><span className="tabular-nums">{Math.round(dup.similarity * 100)}%</span> match</StatusBadge>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
              <li className="truncate">{titleA ?? "Project A"}</li>
              <li className="truncate">{titleB ?? "Project B"}</li>
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None flagged.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="flex items-center gap-2 text-sm text-foreground">
          <UserRound className="h-4 w-4 text-muted-foreground" /> Needs manual placement
        </span>
        <span className="text-sm text-muted-foreground">
          {data.exception_pool.length === 0 ? "Everyone placed" : `${data.exception_pool.length}`}
        </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── attention list (alerts) ───────────────────────────────────────────────────
export function AlertRow({ alert, lookups }: { alert: AlertView; lookups: Lookups }) {
  const a = friendlyAlert(alert, lookups);
  return (
    <motion.div
      variants={rise}
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{a.title}</span>
        <StatusBadge tone={a.tone} dot>
          {a.severity}
        </StatusBadge>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.description}</p>
      {a.context && <p className="mt-1.5 text-xs font-medium text-foreground/70">{a.context}</p>}
    </motion.div>
  );
}

export function AttentionList({ alerts, lookups }: { alerts: AlertView[]; lookups: Lookups }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Inbox className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Needs your attention</h2>
        <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {alerts.length}
        </span>
      </div>
      {alerts.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">All clear. Nothing to review.</Card>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
          {alerts.map((a, i) => (
            <AlertRow key={`${a.trigger_type}-${i}`} alert={a} lookups={lookups} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── shared run button ─────────────────────────────────────────────────────────
export function SampleBadge() {
  return (
    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Sample data
    </span>
  );
}

// ── loading skeletons (shape-matched to the real cards) ──────────────────────
export function StatTileSkeleton() {
  return (
    <Card className="flex items-center gap-4 p-6">
      <Skeleton className="h-11 w-11 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-10" />
        <Skeleton className="h-3 w-20" />
      </div>
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-[84px] w-[84px] rounded-full" />
      </div>
      <div className="h-px bg-border/60" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-9" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AlertRowSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-2.5 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-2/3" />
    </div>
  );
}
