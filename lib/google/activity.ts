import { getActivityClient } from "./auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type PollResult = {
  folderId: string;
  fetched: number;
  inserted: number;
  skippedUnattributed: number;
};

/** Collapse a Drive Activity primaryActionDetail into a short action label
 *  matching what activity_log.action / event_type expect. */
function actionLabel(detail: Record<string, unknown> | undefined): string {
  if (!detail) return "unknown";
  return Object.keys(detail)[0] ?? "unknown"; // e.g. "edit", "create", "comment", "move"
}

/** Poll the Drive Activity API for one team's workspace folder and append rows to
 *  activity_log — the read side that feeds engagement_signal_rate in the health score (Guide §7).
 *
 *  ⚠️ Attribution caveat (read before trusting the numbers):
 *  Drive Activity returns an actor as a People resource name (people/ID), NOT an email.
 *  Resolving that to an email requires either People API + Workspace domain-wide delegation,
 *  which a personal-folder share does NOT grant. So for the personal-account prototype path,
 *  activities we can't tie to a known student are counted as `skippedUnattributed` rather than
 *  guessed. If/when IIT grants Workspace + a Shared Drive, add delegated email resolution here.
 *  Until then, engagement is best tracked as folder-level edit volume (still a valid signal). */
export async function pollTeamActivity(
  teamId: string,
  folderId: string,
): Promise<PollResult> {
  const activity = getActivityClient();
  const supabase = createAdminClient();

  // Only pull events since the last successful poll for this folder.
  const { data: cursor } = await supabase
    .from("drive_sync_state")
    .select("last_poll_at")
    .eq("folder_id", folderId)
    .maybeSingle();
  const since = cursor?.last_poll_at as string | undefined;

  // email -> student_id for this team, used for best-effort attribution.
  const { data: members } = await supabase
    .from("team_members")
    .select("students ( id, email )")
    .eq("team_id", teamId);
  const emailToStudent = new Map<string, string>();
  for (const m of members ?? []) {
    // Supabase types the embedded relation as an array; team_members → students is to-one.
    const rel = (m as unknown as { students?: { id: string; email: string } | { id: string; email: string }[] }).students;
    const s = Array.isArray(rel) ? rel[0] : rel;
    if (s?.email) emailToStudent.set(s.email.toLowerCase(), s.id);
  }

  let pageToken: string | undefined;
  let fetched = 0;
  let inserted = 0;
  let skippedUnattributed = 0;

  do {
    const res = await activity.activity.query({
      requestBody: {
        ancestorName: `items/${folderId}`,
        filter: since ? `time > "${since}"` : undefined,
        pageToken,
      },
    });

    for (const act of res.data.activities ?? []) {
      fetched++;
      const ts = act.timestamp ?? act.timeRange?.endTime ?? undefined;
      const action = actionLabel(act.primaryActionDetail as Record<string, unknown>);
      const fileId =
        act.targets?.[0]?.driveItem?.name?.replace(/^items\//, "") ?? null;

      // Best-effort attribution: Drive Activity rarely exposes an email on the personal
      // share path, so most events land here as unattributed (see caveat above).
      const actorEmail = (
        act.actors?.[0] as { user?: { knownUser?: { personName?: string } } }
      )?.user?.knownUser?.personName;
      const studentId = actorEmail
        ? emailToStudent.get(actorEmail.toLowerCase())
        : undefined;

      if (!studentId) {
        skippedUnattributed++;
        continue;
      }

      const { error } = await supabase.from("activity_log").insert({
        student_id: studentId,
        file_id: fileId,
        action,
        event_type: action,
        ts: ts ?? undefined,
      });
      if (!error) inserted++;
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  // Advance the cursor so the next poll starts here. Set last_poll_at explicitly —
  // the column default only fires on INSERT, not on the conflict UPDATE path.
  await supabase
    .from("drive_sync_state")
    .upsert(
      { folder_id: folderId, last_poll_at: new Date().toISOString() },
      { onConflict: "folder_id" },
    );

  return { folderId, fetched, inserted, skippedUnattributed };
}
