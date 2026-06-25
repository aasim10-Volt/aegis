begin;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  team_id text not null references public.teams(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_content_length check (
    char_length(content) >= 1 and char_length(content) <= 2000
  )
);

create index if not exists messages_team_time
  on public.messages (team_id, created_at desc);

alter table public.messages enable row level security;

-- admins see all; a student sees their own team's chat; a lecturer sees only
-- teams whose members belong to a cohort assigned to them (H1, mirrors teams_scope).
create policy "messages_select_own_team"
  on public.messages for select
  using (
    is_admin()
    or exists (
      select 1 from public.team_members tm
      where tm.student_id = auth.uid()
      and tm.team_id = messages.team_id
    )
    or exists (
      select 1 from public.team_members tm
      join public.students s on s.id = tm.student_id
      join public.lecturer_cohorts lc on lc.cohort_id = s.cohort_id
      where tm.team_id = messages.team_id
      and lc.lecturer_id = auth.uid()
    )
  );

create policy "messages_insert_own_team"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.team_members tm
      where tm.student_id = auth.uid()
      and tm.team_id = messages.team_id
    )
  );

create policy "messages_no_update"
  on public.messages for update
  using (false);

create policy "messages_no_delete"
  on public.messages for delete
  using (false);

alter publication supabase_realtime add table public.messages;

commit;
