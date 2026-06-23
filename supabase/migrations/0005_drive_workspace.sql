-- ============================================================================
-- 0005_drive_workspace.sql — Google Drive integration surface
-- Adds the columns/tables the Drive provisioner + activity poller write to.
-- All writes happen via the service-role client (lib/supabase/admin.ts), which
-- bypasses RLS — so these tables stay default-deny for the anon/auth key.
-- ============================================================================

-- Where each team's provisioned Drive folder lives (set once at allocation time).
alter table teams add column if not exists drive_folder_id text;

-- Poll cursor: remember the last time we read Drive Activity for a folder so each
-- poll only fetches new events instead of re-scanning all history (Guide §7, 72h cadence).
create table if not exists drive_sync_state (
  folder_id    text primary key,
  last_poll_at timestamptz not null default now()
);

alter table drive_sync_state enable row level security;
-- No policies → default-deny for anon/auth keys. Only the service role touches this.
