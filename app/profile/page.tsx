"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Target, TrendingUp, Users } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { useAccessGuard } from "@/components/auth/role-guard";
import { SampleDataBanner } from "@/components/aegis/sample-data-banner";
import { useUser } from "@/components/auth/user-provider";
import { Card } from "@/components/ui/card";
import { SkillCheck, StatTile, rise, stagger } from "@/components/dashboard";
import { routeFor } from "@/lib/nav";
import { useRun } from "@/lib/use-run";

export default function ProfilePage() {
  const router = useRouter();
  const ready = useAccessGuard("profile");
  const { user } = useUser();
  const { data, sample } = useRun(ready);

  if (!ready) return null;

  const me = data?.student_profiles.find((p) => p.student_id === user?.studentId) ?? null;
  const myTeam = data?.teams.find((t) => t.project_id === me?.project_id) ?? null;
  const rank = me?.rationale.match(/preference #(\d+)/i)?.[1] ?? null;

  return (
    <AppShell active="profile" onNavigate={(key) => router.push(routeFor(key))}>
      <div className="flex flex-col gap-8">
        {sample && <SampleDataBanner />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your skills as verified against the evidence on record, and where they placed you.
          </p>
        </div>

        {!me ? (
          <Card className="border-dashed bg-secondary/30 p-12 text-center text-sm text-muted-foreground">
            Your profile will appear here once the allocation has run.
          </Card>
        ) : (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4 lg:grid-cols-3"
            >
              <motion.div variants={rise}>
                <StatTile
                  icon={Users}
                  label="My project"
                  value={
                    <span className="text-base font-semibold">
                      {myTeam?.project_title ?? "-"}
                    </span>
                  }
                />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile
                  icon={TrendingUp}
                  label="My fit for it"
                  value={me.fit != null ? `${Math.round(me.fit)}%` : "-"}
                />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile
                  icon={Target}
                  label="Preference matched"
                  value={rank ? `#${rank}` : "-"}
                />
              </motion.div>
            </motion.div>

            <motion.div variants={rise} initial="hidden" animate="show">
              <SkillCheck student={me} />
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
