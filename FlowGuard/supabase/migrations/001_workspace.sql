-- Minimal hackathon schema: all nine existing collections are one atomic snapshot.
begin;
create table public.flowguard_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision > 0),
  data jsonb not null check (
    jsonb_typeof(data) = 'object' and
    data ?& array['clients','projects','tasks','changeRequests','team','commitments','dependencies','actionItems','handovers'] and
    jsonb_typeof(data->'clients') = 'array' and jsonb_typeof(data->'projects') = 'array' and
    jsonb_typeof(data->'tasks') = 'array' and jsonb_typeof(data->'changeRequests') = 'array' and
    jsonb_typeof(data->'team') = 'array' and jsonb_typeof(data->'commitments') = 'array' and
    jsonb_typeof(data->'dependencies') = 'array' and jsonb_typeof(data->'actionItems') = 'array' and
    jsonb_typeof(data->'handovers') = 'array'
  ),
  updated_at timestamptz not null default now()
);
alter table public.flowguard_workspaces enable row level security;
revoke all on public.flowguard_workspaces from anon, authenticated;
grant select, insert, update on public.flowguard_workspaces to authenticated;
create policy own_read on public.flowguard_workspaces for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy own_insert on public.flowguard_workspaces for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy own_update on public.flowguard_workspaces for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
commit;
