import { createClient } from "@/lib/supabase/server";

/** Resolve the current user and confirm they're an admin (mirrors the SQL is_admin()
 *  helper in 0001_base_schema.sql). Returns null when not an authenticated admin —
 *  the caller turns that into a 401/403. Provisioning grants real Drive access, so it
 *  must never be reachable by a student/lecturer session. */
export async function requireAdmin(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return null;

  return { id: user.id };
}
