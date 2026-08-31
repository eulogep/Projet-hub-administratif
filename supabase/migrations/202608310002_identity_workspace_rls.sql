alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.organizations enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.workspaces from anon;
revoke all on table public.organizations from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.organizations to authenticated;

revoke all on function public.bootstrap_personal_workspace() from public;
revoke all on function public.bootstrap_personal_workspace() from anon;
grant execute on function public.bootstrap_personal_workspace() to authenticated;

create policy profiles_select_own
on public.profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profiles_update_own
on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profiles_delete_own
on public.profiles for delete to authenticated
using (user_id = (select auth.uid()));

create policy workspaces_select_own
on public.workspaces for select to authenticated
using (owner_user_id = (select auth.uid()));

create policy workspaces_insert_own
on public.workspaces for insert to authenticated
with check (owner_user_id = (select auth.uid()));

create policy workspaces_update_own
on public.workspaces for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy workspaces_delete_own
on public.workspaces for delete to authenticated
using (owner_user_id = (select auth.uid()));

create policy organizations_select_own_workspace
on public.organizations for select to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = organizations.workspace_id
      and workspaces.owner_user_id = (select auth.uid())
  )
);

create policy organizations_insert_own_workspace
on public.organizations for insert to authenticated
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = organizations.workspace_id
      and workspaces.owner_user_id = (select auth.uid())
  )
);

create policy organizations_update_own_workspace
on public.organizations for update to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = organizations.workspace_id
      and workspaces.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = organizations.workspace_id
      and workspaces.owner_user_id = (select auth.uid())
  )
);

create policy organizations_delete_own_workspace
on public.organizations for delete to authenticated
using (
  exists (
    select 1
    from public.workspaces
    where workspaces.id = organizations.workspace_id
      and workspaces.owner_user_id = (select auth.uid())
  )
);
