alter table public.organizations
  add column archived_at timestamptz;

alter table public.organizations
  drop constraint organizations_type_check;

update public.organizations
set type = case type
  when 'company' then 'employer'
  when 'public_service' then 'administration'
  when 'school' then 'university'
  else type
end;

alter table public.organizations
  add constraint organizations_type_check
  check (type in ('employer', 'crous', 'university', 'cfa', 'opco', 'administration', 'other'));

alter table public.organizations
  drop constraint organizations_name_check;

alter table public.organizations
  add constraint organizations_name_check
  check (name = btrim(name) and char_length(name) between 1 and 160);

drop index public.organizations_workspace_name_unique;

create unique index organizations_active_workspace_name_unique
  on public.organizations (workspace_id, lower(name))
  where archived_at is null;

create index organizations_workspace_archive_name_idx
  on public.organizations (workspace_id, archived_at, name);
