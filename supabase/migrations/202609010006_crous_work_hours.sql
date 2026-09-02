create table public.crous_hour_periods (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mission_id uuid not null,
  label text not null check (label = btrim(label) and char_length(label) between 1 and 160),
  starts_on date not null,
  ends_on date not null,
  target_minutes integer not null check (target_minutes between 0 and 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint crous_hour_periods_id_workspace_unique unique (id, workspace_id),
  foreign key (mission_id, workspace_id) references public.missions(id, workspace_id),
  check (ends_on >= starts_on)
);
create unique index crous_hour_periods_active_identity_idx on public.crous_hour_periods(workspace_id, mission_id, starts_on, ends_on, lower(label)) where archived_at is null;
create index crous_hour_periods_workspace_archive_idx on public.crous_hour_periods(workspace_id, archived_at, starts_on desc);

create table public.crous_work_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  period_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  calculated_minutes integer not null default 1 check (calculated_minutes > 0),
  credited_minutes integer not null check (credited_minutes between 0 and 10080),
  adjustment_reason text check (adjustment_reason is null or (adjustment_reason = btrim(adjustment_reason) and char_length(adjustment_reason) between 1 and 500)),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  foreign key (period_id, workspace_id) references public.crous_hour_periods(id, workspace_id) on delete cascade,
  check ((credited_minutes = calculated_minutes and adjustment_reason is null) or (credited_minutes <> calculated_minutes and adjustment_reason is not null))
);
create index crous_work_logs_period_timeline_idx on public.crous_work_logs(workspace_id, period_id, archived_at, starts_at, ends_at);

create function public.derive_crous_work_log_duration()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  seconds numeric;
  period_start date;
  period_end date;
begin
  seconds := extract(epoch from (new.ends_at - new.starts_at));
  if seconds <= 0 or mod(seconds, 60) <> 0 then
    raise exception 'Work log must contain positive whole minutes' using errcode = '23514';
  end if;
  select starts_on, ends_on into period_start, period_end from public.crous_hour_periods
    where id = new.period_id and workspace_id = new.workspace_id;
  if period_start is null or (new.starts_at at time zone 'Europe/Paris')::date < period_start
    or (new.ends_at at time zone 'Europe/Paris')::date > period_end then
    raise exception 'Work log is outside its period' using errcode = '23514';
  end if;
  new.calculated_minutes := (seconds / 60)::integer;
  if new.credited_minutes is null then new.credited_minutes := new.calculated_minutes; end if;
  if new.credited_minutes = new.calculated_minutes then new.adjustment_reason := null; end if;
  if new.credited_minutes <> new.calculated_minutes and (new.adjustment_reason is null or btrim(new.adjustment_reason) = '') then
    raise exception 'Adjusted duration requires a reason' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger crous_hour_periods_set_updated_at before update on public.crous_hour_periods for each row execute function public.set_updated_at();
create trigger crous_work_logs_derive_duration before insert or update of period_id, workspace_id, starts_at, ends_at, credited_minutes, adjustment_reason on public.crous_work_logs for each row execute function public.derive_crous_work_log_duration();
create trigger crous_work_logs_set_updated_at before update on public.crous_work_logs for each row execute function public.set_updated_at();

alter table public.crous_hour_periods enable row level security;
alter table public.crous_work_logs enable row level security;
revoke all on table public.crous_hour_periods from anon;
revoke all on table public.crous_work_logs from anon;
grant select, insert, update, delete on table public.crous_hour_periods to authenticated;
grant select, insert, update, delete on table public.crous_work_logs to authenticated;

create policy crous_hour_periods_select_own_workspace on public.crous_hour_periods for select to authenticated using (exists (select 1 from public.workspaces where workspaces.id = crous_hour_periods.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_hour_periods_insert_own_workspace on public.crous_hour_periods for insert to authenticated with check (exists (select 1 from public.workspaces where workspaces.id = crous_hour_periods.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_hour_periods_update_own_workspace on public.crous_hour_periods for update to authenticated using (exists (select 1 from public.workspaces where workspaces.id = crous_hour_periods.workspace_id and workspaces.owner_user_id = (select auth.uid()))) with check (exists (select 1 from public.workspaces where workspaces.id = crous_hour_periods.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_hour_periods_delete_own_workspace on public.crous_hour_periods for delete to authenticated using (exists (select 1 from public.workspaces where workspaces.id = crous_hour_periods.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_work_logs_select_own_workspace on public.crous_work_logs for select to authenticated using (exists (select 1 from public.workspaces where workspaces.id = crous_work_logs.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_work_logs_insert_own_workspace on public.crous_work_logs for insert to authenticated with check (exists (select 1 from public.workspaces where workspaces.id = crous_work_logs.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_work_logs_update_own_workspace on public.crous_work_logs for update to authenticated using (exists (select 1 from public.workspaces where workspaces.id = crous_work_logs.workspace_id and workspaces.owner_user_id = (select auth.uid()))) with check (exists (select 1 from public.workspaces where workspaces.id = crous_work_logs.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy crous_work_logs_delete_own_workspace on public.crous_work_logs for delete to authenticated using (exists (select 1 from public.workspaces where workspaces.id = crous_work_logs.workspace_id and workspaces.owner_user_id = (select auth.uid())));
