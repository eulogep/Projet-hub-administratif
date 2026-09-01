create extension if not exists unaccent with schema extensions;

alter table public.organizations
  add constraint organizations_id_workspace_unique unique (id, workspace_id);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  first_name text check (first_name is null or (first_name = btrim(first_name) and char_length(first_name) between 1 and 120)),
  last_name text check (last_name is null or (last_name = btrim(last_name) and char_length(last_name) between 1 and 120)),
  display_name text not null check (display_name = btrim(display_name) and char_length(display_name) between 1 and 180),
  search_name text not null default '',
  primary_email text check (
    primary_email is null or (
      primary_email = lower(btrim(primary_email))
      and char_length(primary_email) between 3 and 254
      and primary_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    )
  ),
  primary_phone text check (primary_phone is null or (primary_phone = btrim(primary_phone) and char_length(primary_phone) between 1 and 40)),
  category text check (category is null or (category = btrim(category) and char_length(category) between 1 and 80)),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint contacts_id_workspace_unique unique (id, workspace_id)
);

create function public.set_contact_search_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_name := lower(extensions.unaccent(new.display_name));
  return new;
end;
$$;

create trigger contacts_set_search_name
before insert or update of display_name on public.contacts
for each row execute function public.set_contact_search_name();

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

create index contacts_workspace_archive_name_idx
  on public.contacts (workspace_id, archived_at, search_name);
create index contacts_workspace_email_idx
  on public.contacts (workspace_id, primary_email)
  where primary_email is not null;

create table public.contact_organizations (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid not null,
  organization_id uuid not null,
  job_title text check (job_title is null or (job_title = btrim(job_title) and char_length(job_title) between 1 and 160)),
  role_label text check (role_label is null or (role_label = btrim(role_label) and char_length(role_label) between 1 and 160)),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (contact_id, organization_id),
  foreign key (contact_id, workspace_id)
    references public.contacts(id, workspace_id) on delete cascade,
  foreign key (organization_id, workspace_id)
    references public.organizations(id, workspace_id)
);

create unique index contact_organizations_one_primary_idx
  on public.contact_organizations (contact_id)
  where is_primary;
create index contact_organizations_workspace_organization_idx
  on public.contact_organizations (workspace_id, organization_id, contact_id);

create table public.contact_interactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid not null,
  organization_id uuid,
  kind text not null check (kind in ('email', 'phone', 'meeting', 'message', 'other')),
  summary text not null check (summary = btrim(summary) and char_length(summary) between 1 and 2000),
  occurred_at timestamptz not null,
  follow_up_label text check (follow_up_label is null or (follow_up_label = btrim(follow_up_label) and char_length(follow_up_label) between 1 and 240)),
  follow_up_on date,
  follow_up_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (contact_id, workspace_id)
    references public.contacts(id, workspace_id) on delete cascade,
  foreign key (organization_id, workspace_id)
    references public.organizations(id, workspace_id),
  check (follow_up_on is null or follow_up_label is not null),
  check (follow_up_completed_at is null or follow_up_label is not null)
);

create trigger contact_interactions_set_updated_at
before update on public.contact_interactions
for each row execute function public.set_updated_at();

create index contact_interactions_contact_timeline_idx
  on public.contact_interactions (workspace_id, contact_id, occurred_at desc, id desc);
create index contact_interactions_open_follow_up_idx
  on public.contact_interactions (workspace_id, follow_up_on, contact_id)
  where follow_up_label is not null and follow_up_completed_at is null;

alter table public.contacts enable row level security;
alter table public.contact_organizations enable row level security;
alter table public.contact_interactions enable row level security;

revoke all on table public.contacts from anon;
revoke all on table public.contact_organizations from anon;
revoke all on table public.contact_interactions from anon;

grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.contact_organizations to authenticated;
grant select, insert, update, delete on table public.contact_interactions to authenticated;

create policy contacts_select_own_workspace
on public.contacts for select to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contacts.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contacts_insert_own_workspace
on public.contacts for insert to authenticated
with check (exists (
  select 1 from public.workspaces
  where workspaces.id = contacts.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contacts_update_own_workspace
on public.contacts for update to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contacts.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.workspaces
  where workspaces.id = contacts.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contacts_delete_own_workspace
on public.contacts for delete to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contacts.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_organizations_select_own_workspace
on public.contact_organizations for select to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_organizations.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_organizations_insert_own_workspace
on public.contact_organizations for insert to authenticated
with check (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_organizations.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_organizations_update_own_workspace
on public.contact_organizations for update to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_organizations.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_organizations.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_organizations_delete_own_workspace
on public.contact_organizations for delete to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_organizations.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_interactions_select_own_workspace
on public.contact_interactions for select to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_interactions.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_interactions_insert_own_workspace
on public.contact_interactions for insert to authenticated
with check (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_interactions.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_interactions_update_own_workspace
on public.contact_interactions for update to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_interactions.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_interactions.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));

create policy contact_interactions_delete_own_workspace
on public.contact_interactions for delete to authenticated
using (exists (
  select 1 from public.workspaces
  where workspaces.id = contact_interactions.workspace_id
    and workspaces.owner_user_id = (select auth.uid())
));
