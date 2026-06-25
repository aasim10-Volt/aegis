"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Inbox, Loader2, Play, ShieldCheck, Users } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { PipelineStepper } from "@/components/aegis/pipeline-stepper";
import { useUser } from "@/components/auth/user-provider";
import { SampleDataBanner } from "@/components/aegis/sample-data-banner";
import { StudentWorkspace } from "@/components/student-workspace";
import { isStudent } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import {
  AttentionList,
  EASE,
  ReviewPanel,
  SampleBadge,
  SkillCheck,
  StatTile,
  TeamCard,
  rise,
  stagger,
} from "@/components/dashboard";
import { PIPELINE_STEPS, SUMMARY } from "@/lib/labels";
import { routeFor } from "@/lib/nav";
import { useRun } from "@/lib/use-run";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const student = isStudent(user?.role);
  // Students auto-fetch (their view is read-only); staff drive the run manually.
  const { status, stage, data, sample, run, lookups } = useRun(!loading && student);
  const spotlight = data?.student_profiles.find((p) => p.skills.some((s) => s.corrected));
  const count = (b: string) => data?.teams.filter((t) => t.band === b).length ?? 0;

  // A student who is not yet a cohort member and hasn't filled the skills survey is
  // sent to onboarding first. (Demo accounts mapped to a real student_id skip this.)
  const needsOnboarding = !loading && student && !user?.studentId && !user?.skillsCompleted;
  useEffect(() => {
    if (needsOnboarding) router.push("/onboarding");
  }, [needsOnboarding, router]);

  // ── Student: their own team only — never the all-teams overview ──────────────
  if (!loading && student) {
    if (needsOnboarding) return null; // redirecting to /onboarding
    const myTeam =
      data?.teams.find((t) =>
        t.members.some((m) => m.student_id === user?.studentId),
      ) ?? null;
    const myProfile =
      data?.student_profiles.find((p) => p.student_id === user?.studentId) ?? null;
    return (
      <AppShell active="overview" onNavigate={(key) => router.push(routeFor(key))}>
        <StudentWorkspace
          team={myTeam}
          profile={myProfile}
          studentId={user?.studentId ?? null}
          name={user?.name ?? ""}
          loading={status !== "done"}
          sample={sample}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      active="overview"
      onNavigate={(key) => router.push(routeFor(key))}
      rail={data && lookups ? <AttentionList alerts={data.alerts} lookups={lookups} /> : undefined}
    >
      <div className="flex flex-col gap-8">
        {sample && <SampleDataBanner />}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Allocation overview</h1>
              {sample && <SampleBadge />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Balanced teams at a glance, and anything that needs your attention.
            </p>
          </div>
          <motion.button
            onClick={run}
            disabled={status === "running"}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-shadow hover:shadow-card-lg disabled:opacity-60"
          >
            {status === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {status === "running" ? "Working…" : "Run allocation"}
          </motion.button>
        </div>

        <PipelineStepper stages={PIPELINE_STEPS} current={stage} done={status === "done"} />

        {status === "idle" && (
          <Card className="border-dashed bg-secondary/30 p-12 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary/60" />
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Run an allocation to form balanced teams and surface anything that needs a closer look.
            </p>
          </Card>
        )}

        {data && lookups && (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              <motion.div variants={rise}>
                <StatTile icon={Users} label={SUMMARY.teams} value={data.teams.length} />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile icon={ShieldCheck} label={SUMMARY.onTrack} value={count("healthy")} />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile
                  icon={AlertTriangle}
                  label={SUMMARY.attention}
                  value={count("at_risk") + count("critical")}
                />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile icon={Inbox} label={SUMMARY.alerts} value={data.alerts.length} />
              </motion.div>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {data.teams.map((t) => (
                <motion.div
                  key={t.team_id}
                  variants={rise}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                >
                  <TeamCard team={t} />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
              <motion.div variants={rise}>
                {spotlight ? (
                  <SkillCheck student={spotlight} />
                ) : (
                  <Card className="flex h-full items-center p-6 text-sm text-muted-foreground">
                    No skill adjustments were needed this run.
                  </Card>
                )}
              </motion.div>
              <motion.div variants={rise}>
                <ReviewPanel data={data} lookups={lookups} />
              </motion.div>
            </motion.div>

            <div className="xl:hidden">
              <AttentionList alerts={data.alerts} lookups={lookups} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
