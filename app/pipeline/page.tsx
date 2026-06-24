"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, GitBranch, Inbox, Loader2, Play, UserRound, Users } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { PipelineStepper } from "@/components/aegis/pipeline-stepper";
import { Card } from "@/components/ui/card";
import { EASE, SampleBadge, StatTile, rise, stagger } from "@/components/dashboard";
import { useAccessGuard } from "@/components/auth/role-guard";
import { SampleDataBanner } from "@/components/aegis/sample-data-banner";
import { PIPELINE_STEPS } from "@/lib/labels";
import { routeFor } from "@/lib/nav";
import { useRun } from "@/lib/use-run";

export default function PipelinePage() {
  const router = useRouter();
  const ready = useAccessGuard("pipeline");
  const { status, stage, data, sample, run } = useRun();

  if (!ready) return null;

  return (
    <AppShell active="pipeline" onNavigate={(key) => router.push(routeFor(key))}>
      <div className="flex flex-col gap-8">
        {sample && <SampleDataBanner />}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Allocation pipeline</h1>
              {sample && <SampleBadge />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Watch each stage run, from checking details to reviewing alerts.
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
            <GitBranch className="mx-auto h-8 w-8 text-primary/60" />
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Run an allocation to watch the five stages complete and see what each one produced.
            </p>
          </Card>
        )}

        {status === "done" && data && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4 lg:grid-cols-5"
          >
            <motion.div variants={rise}>
              <StatTile icon={Users} label="Students considered" value={data.student_profiles.length} />
            </motion.div>
            <motion.div variants={rise}>
              <StatTile icon={GitBranch} label="Teams formed" value={data.teams.length} />
            </motion.div>
            <motion.div variants={rise}>
              <StatTile icon={Copy} label="Duplicates flagged" value={data.duplicate_flags.length} />
            </motion.div>
            <motion.div variants={rise}>
              <StatTile icon={UserRound} label="Held for review" value={data.exception_pool.length} />
            </motion.div>
            <motion.div variants={rise}>
              <StatTile icon={Inbox} label="Alerts raised" value={data.alerts.length} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
