import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role Supabase client — bypasses RLS. SERVER ONLY.
 *  Writes to activity_log / teams are default-denied under RLS (see 0001_base_schema.sql),
 *  so the Drive provisioner + activity poller must use this client, never the cookie client.
 *  Never import this into anything that ships to the browser. */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createAdminClient: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (server env only).",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
