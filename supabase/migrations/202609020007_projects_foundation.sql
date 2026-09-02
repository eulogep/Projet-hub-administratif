create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid not null,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 180),
  description text check (description is null or char_length(description) <= 4000),
  status text not null default 'planned' check (status in ('planned', 'active', 'on_hold', 'completed', 'cancelled')),
  starts_on date,
  target_ends_on date,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_id_workspace_unique unique (id, workspace_id),
  constraint projects_id_workspace_organization_unique unique (id, workspace_id, organization_id),
  foreign key (organization_id, workspace_id) references public.organizations(id, workspace_id),
  check (target_ends_on is null or starts_on is null or target_ends_on >= starts_on),
  check ((status = 'completed') = (completed_at is not null))
);

create unique index projects_active_name_idx
  on public.projects (workspace_id, organization_id, lower(name))
  where archived_at is null;
create index projects_workspace_filter_idx
  on public.projects (workspace_id, archived_at, organization_id, status, target_ends_on, name);

create function public.set_project_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger projects_set_completion
before insert or update of status on public.projects
for each row execute function public.set_project_completion();
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.missions add column project_id uuid;
alter table public.missions add constraint missions_project_workspace_organization_fk
  foreign key (project_id, workspace_id, organization_id)
  references public.projects(id, workspace_id, organization_id);
create index missions_workspace_project_idx
  on public.missions (workspace_id, project_id, archived_at);

alter table public.projects enable row level security;
revoke all on table public.projects from anon;
grant select, insert, update, delete on table public.projects to authenticated;

create policy projects_select_own_workspace on public.projects for select to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = projects.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy projects_insert_own_workspace on public.projects for insert to authenticated
with check (exists (select 1 from public.workspaces where workspaces.id = projects.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy projects_update_own_workspace on public.projects for update to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = projects.workspace_id and workspaces.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.workspaces where workspaces.id = projects.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy projects_delete_own_workspace on public.projects for delete to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = projects.workspace_id and workspaces.owner_user_id = (select auth.uid())));
