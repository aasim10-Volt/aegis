"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GitPullRequestArrow, ScrollText, ShieldCheck, ShieldX, UserCheck } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import {
  type ApprovalView,
  type AuditView,
  type IntegrityView,
  type OverrideView,
  getApprovals,
  getAudit,
  getIntegrity,
  getOverrides,
} from "@/lib/api";

const ACTION_LABEL: Record<string, string> = {
  login: "Signed in",
  lecturer_approved: "Lecturer approved",
  lecturer_revoked: "Lecturer access revoked",
  cohort_assigned: "Cohort assigned",
  cohort_unassigned: "Cohort unassigned",
  role_changed: "Role changed",
  allocation_run: "Allocation run",
  recommendation_overridden: "Recommendation overridden",
  appeal_decided: "Appeal decided",
  data_exported: "Data exported",
  alert_acknowledged: "Alert acknowledged",
};
const actionLabel = (a: string) => ACTION_LABEL[a] ?? a.replace(/_/g, " ");
const teamName = (id: string) => id.replace(/^T::/, "Team ");

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
});

function IntegrityBadge({ integrity }: { integrity: IntegrityView | null }) {
  if (!integrity) {
    return <Card className="p-6 text-sm text-muted-foreground">Checking audit-log integrity…</Card>;
  }
  const ok = integrity.verified;
  const color = ok ? "var(--healthy)" : "var(--critical)";
  const Icon = ok ? ShieldCheck : ShieldX;
  return (
    <Card className="flex items-center gap-4 p-6">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold text-foreground">
          {ok ? "Audit log verified" : "Audit log tampered"}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {ok
            ? `Tamper-evident chain intact across ${integrity.entries} recorded actions.`
            : `Chain breaks at entry ${integrity.broken_at}.`}
        </p>
      </div>
      <div className="ml-auto hidden sm:block">
        <StatusBadge tone={ok ? "healthy" : "critical"} dot>
          {ok ? "Verified" : "Tampered"}
        </StatusBadge>
      </div>
    </Card>
  );
}

function Panel({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof UserCheck;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [integrity, setIntegrity] = React.useState<IntegrityView | null>(null);
  const [audit, setAudit] = React.useState<AuditView[]>([]);
  const [approvals, setApprovals] = React.useState<ApprovalView[]>([]);
  const [overrides, setOverrides] = React.useState<OverrideView[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([getIntegrity(), getAudit(), getApprovals(), getOverrides()])
      .then(([i, a, ap, ov]) => {
        setIntegrity(i);
        setAudit(a);
        setApprovals(ap);
        setOverrides(ov);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const navigate = (key: string) => router.push(key === "settings" ? "/admin" : "/");

  return (
    <AppShell active="settings" onNavigate={navigate}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every privileged action is recorded and tamper-evident — nothing happens unlogged.
          </p>
        </div>

        {error && (
          <Card className="border-[color-mix(in_oklch,var(--critical)_35%,transparent)] p-4 text-sm text-[var(--critical)]">
            {error}
          </Card>
        )}

        <motion.div {...fade(0)}>
          <IntegrityBadge integrity={integrity} />
        </motion.div>

        <motion.div {...fade(1)} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Pending approvals" icon={UserCheck} count={approvals.length}>
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts awaiting approval.</p>
            ) : (
              approvals.map((a) => (
                <div
                  key={a.request_id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.email} · requests {a.role_requested}
                    </p>
                  </div>
                  <button className="shrink-0 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-card">
                    Approve
                  </button>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Override watch" icon={GitPullRequestArrow} count={overrides.length}>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No engine recommendations overridden.</p>
            ) : (
              overrides.map((o) => (
                <div key={`${o.team_id}-${o.at}`} className="rounded-2xl bg-secondary/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{teamName(o.team_id)}</p>
                    <StatusBadge tone="info">{o.from_status} → {o.to_status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.lecturer} — “{o.reason}”
                  </p>
                </div>
              ))
            )}
          </Panel>
        </motion.div>

        <motion.div {...fade(2)}>
          <Panel title="Activity log" icon={ScrollText} count={audit.length}>
            <div className="flex flex-col gap-1.5">
              {audit.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-secondary/50"
                >
                  <span className="w-6 shrink-0 text-xs text-muted-foreground">{e.id}</span>
                  <span className="font-medium text-foreground">{actionLabel(e.action)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {e.actor_role}
                    {e.target_id ? ` · ${teamName(e.target_id)}` : ""}
                    {e.reason ? ` · “${e.reason}”` : ""}
                  </span>
                  <span
                    className="ml-auto hidden shrink-0 font-mono text-[0.625rem] text-muted-foreground/70 sm:block"
                    title={e.row_hash ?? ""}
                  >
                    {e.row_hash?.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>
    </AppShell>
  );
}
