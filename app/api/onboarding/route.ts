import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs"; // service-role writes need Node, not the Edge runtime.

/** POST /api/onboarding  { skills, capacity_hours, preferred_role }
 *  Option A: make the signed-in student a real cohort member so the engine can place
 *  them. Writes a `students` row + `skills_declared` (service role; RLS-bypassing) and
 *  links the auth user to it (user_metadata.student_id = auth uid). The student appears
 *  in allocation after the engine cache is reloaded (admin POST /admin/reload or a
 *  backend restart) and allocation is re-run.
 *
 *  NOTE: this adds to the SAME live cohort the dashboard runs on — the documented
 *  70-student / 15-team figures change once students onboard. Remove test students with
 *  scripts/cleanup_onboarded.py. */
const COHORT_ID = "f901302d-af30-5da2-b755-88135e354c51"; // live cohort
const DISCIPLINES = ["technical", "ux", "management", "communication"] as const;

export async function POST(req: Request) {
  // Identify the caller from their session — they may only onboard themselves.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: { skills?: Record<string, unknown>; capacity_hours?: unknown; preferred_role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const skills = (body.skills ?? {}) as Record<string, unknown>;
  const clamp = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
  const capacity = Math.min(40, Math.max(0, Number(body.capacity_hours) || 10));
  const preferredRole = String(body.preferred_role ?? "flexible").slice(0, 40);
  const name =
    (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Student";

  const admin = createAdminClient();

  // 1. Upsert the cohort member (id = auth uid, so the dashboard can resolve their team).
  const { error: sErr } = await admin.from("students").upsert(
    {
      id: user.id,
      name,
      email: user.email,
      cohort_id: COHORT_ID,
      capacity_hours: capacity,
      preferred_role: preferredRole,
      preferred_projects: [],
      availability: [],
    },
    { onConflict: "id" },
  );
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  // 2. Replace their declared skills (self-report basis; 1–5 clamped).
  await admin.from("skills_declared").delete().eq("student_id", user.id);
  const { error: skErr } = await admin.from("skills_declared").insert(
    DISCIPLINES.map((d) => ({
      student_id: user.id,
      discipline: d,
      declared_level: clamp(skills[d]),
      confidence_basis: "self_report",
    })),
  );
  if (skErr) return NextResponse.json({ error: skErr.message }, { status: 500 });

  // 3. Link the auth user to the cohort row + mark onboarding complete.
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      student_id: user.id,
      skills_completed: true,
      skills,
      capacity_hours: capacity,
      preferred_role: preferredRole,
    },
  });

  return NextResponse.json({ ok: true });
}
