create table public.missions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid not null,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 180),
  description text check (description is null or char_length(description) <= 4000),
  status text not null default 'draft' check (status in ('draft', 'active', 'on_hold', 'completed')),
  starts_on date,
  target_ends_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint missions_id_workspace_unique unique (id, workspace_id),
  foreign key (organization_id, workspace_id)
    references public.organizations(id, workspace_id),
  check (target_ends_on is null or starts_on is null or target_ends_on >= starts_on),
  check ((status = 'completed') = (completed_at is not null))
);

create index missions_workspace_archive_status_idx
  on public.missions (workspace_id, archived_at, status, target_ends_on, title);
create index missions_workspace_organization_idx
  on public.missions (workspace_id, organization_id, archived_at);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  mission_id uuid not null,
  parent_task_id uuid,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 240),
  description text check (description is null or char_length(description) <= 4000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  starts_on date,
  due_on date,
  completed_at timestamptz,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint tasks_id_mission_workspace_unique unique (id, mission_id, workspace_id),
  foreign key (mission_id, workspace_id)
    references public.missions(id, workspace_id) on delete cascade,
  foreign key (parent_task_id, mission_id, workspace_id)
    references public.tasks(id, mission_id, workspace_id),
  check (parent_task_id is null or parent_task_id <> id),
  check (due_on is null or starts_on is null or due_on >= starts_on),
  check ((status = 'done') = (completed_at is not null))
);

create index tasks_workspace_archive_status_idx
  on public.tasks (workspace_id, archived_at, status, priority, due_on, position, created_at);
create index tasks_mission_parent_position_idx
  on public.tasks (workspace_id, mission_id, parent_task_id, position, created_at);

create function public.set_mission_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    if exists (
      select 1 from public.tasks
      where tasks.workspace_id = new.workspace_id
        and tasks.mission_id = new.id
        and tasks.archived_at is null
        and tasks.status not in ('done', 'cancelled')
    ) then
      raise exception 'Mission has open tasks' using errcode = '23514';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create function public.validate_task_hierarchy_and_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent_parent_id uuid;
begin
  if new.parent_task_id is not null then
    if new.parent_task_id = new.id then
      raise exception 'Task cannot parent itself' using errcode = '23514';
    end if;
    select parent_task_id into parent_parent_id
    from public.tasks
    where id = new.parent_task_id
      and mission_id = new.mission_id
      and workspace_id = new.workspace_id;
    if parent_parent_id is not null then
      raise exception 'Only one subtask level is allowed' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.tasks
      where tasks.workspace_id = new.workspace_id
        and tasks.mission_id = new.mission_id
        and tasks.parent_task_id = new.id
    ) then
      raise exception 'A task with children cannot become a subtask' using errcode = '23514';
    end if;
  end if;

  if new.status = 'done' then
    if exists (
      select 1 from public.tasks
      where tasks.workspace_id = new.workspace_id
        and tasks.mission_id = new.mission_id
        and tasks.parent_task_id = new.id
        and tasks.archived_at is null
        and tasks.status not in ('done', 'cancelled')
    ) then
      raise exception 'Task has open subtasks' using errcode = '23514';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger missions_set_completion
before insert or update of status on public.missions
for each row execute function public.set_mission_completion();
create trigger missions_set_updated_at
before update on public.missions
for each row execute function public.set_updated_at();
create trigger tasks_validate_hierarchy_and_completion
before insert or update of parent_task_id, mission_id, workspace_id, status on public.tasks
for each row execute function public.validate_task_hierarchy_and_completion();
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.missions enable row level security;
alter table public.tasks enable row level security;
revoke all on table public.missions from anon;
revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.missions to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

create policy missions_select_own_workspace on public.missions for select to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = missions.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy missions_insert_own_workspace on public.missions for insert to authenticated
with check (exists (select 1 from public.workspaces where workspaces.id = missions.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy missions_update_own_workspace on public.missions for update to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = missions.workspace_id and workspaces.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.workspaces where workspaces.id = missions.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy missions_delete_own_workspace on public.missions for delete to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = missions.workspace_id and workspaces.owner_user_id = (select auth.uid())));

create policy tasks_select_own_workspace on public.tasks for select to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = tasks.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy tasks_insert_own_workspace on public.tasks for insert to authenticated
with check (exists (select 1 from public.workspaces where workspaces.id = tasks.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy tasks_update_own_workspace on public.tasks for update to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = tasks.workspace_id and workspaces.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.workspaces where workspaces.id = tasks.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy tasks_delete_own_workspace on public.tasks for delete to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = tasks.workspace_id and workspaces.owner_user_id = (select auth.uid())));
