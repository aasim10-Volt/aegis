import { NextResponse } from "next/server";

import { pollTeamActivity } from "@/lib/google/activity";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** POST /api/drive/poll
 *  Sweeps Drive Activity for every provisioned team and appends to activity_log.
 *  Meant to run on a schedule (every DRIVE_POLL_INTERVAL_HOURS, default 72 — Guide §7),
 *  e.g. a Supabase cron / Vercel cron / external scheduler hitting this endpoint.
 *
 *  Auth: a shared secret header, NOT a user session — schedulers have no cookies.
 *  Set DRIVE_POLL_SECRET in the server env and send it as `x-poll-secret`. */
export async function POST(req: Request) {
  const secret = process.env.DRIVE_POLL_SECRET;
  if (!secret || req.headers.get("x-poll-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, drive_folder_id")
    .not("drive_folder_id", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const t of teams ?? []) {
    const team = t as { id: string; drive_folder_id: string };
    try {
      results.push(await pollTeamActivity(team.id, team.drive_folder_id));
    } catch (e) {
      results.push({
        folderId: team.drive_folder_id,
        error: e instanceof Error ? e.message : "poll failed",
      });
    }
  }

  return NextResponse.json({ ok: true, polled: results.length, results });
}
