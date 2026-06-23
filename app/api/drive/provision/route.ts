import { NextResponse } from "next/server";

import { provisionTeamWorkspace } from "@/lib/google/drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/google/guard";

export const runtime = "nodejs"; // googleapis needs Node APIs, not the Edge runtime.

/** POST /api/drive/provision  { teamId: string }
 *  Creates the team's Drive workspace and grants every current member write access.
 *  Admin-only. Idempotency is the caller's job — re-posting creates a second folder,
 *  so only call this once, at allocation time. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let teamId: string;
  try {
    ({ teamId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Body must be JSON: { teamId }." }, { status: 400 });
  }
  if (!teamId) {
    return NextResponse.json({ error: "teamId is required." }, { status: 400 });
  }

  // Pull the member emails the workspace gets shared with.
  const supabase = createAdminClient();
  const { data: members, error } = await supabase
    .from("team_members")
    .select("students ( email )")
    .eq("team_id", teamId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const emails = (members ?? [])
    .map((m) => {
      // Supabase types the embedded relation as an array; team_members → students is to-one.
      const rel = (m as unknown as { students?: { email?: string } | { email?: string }[] }).students;
      const s = Array.isArray(rel) ? rel[0] : rel;
      return s?.email;
    })
    .filter((e): e is string => Boolean(e));

  try {
    const workspace = await provisionTeamWorkspace(teamId, emails);
    return NextResponse.json({ ok: true, ...workspace });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Provisioning failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
