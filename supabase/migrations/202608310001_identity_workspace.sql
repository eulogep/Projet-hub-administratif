create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  timezone text not null default 'Europe/Paris' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  type text not null default 'other'
    check (type in ('company', 'public_service', 'school', 'cfa', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organizations_workspace_name_unique
  on public.organizations (workspace_id, lower(name));
create index organizations_workspace_id_idx on public.organizations (workspace_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create function public.bootstrap_personal_workspace()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  personal_workspace_id uuid;
  profile_name text;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  profile_name := coalesce(
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
    nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''),
    'Personal User'
  );

  insert into public.profiles (user_id, display_name)
  values (current_user_id, profile_name)
  on conflict (user_id) do nothing;

  insert into public.workspaces (owner_user_id, name)
  values (current_user_id, 'Personal Workspace')
  on conflict (owner_user_id) do nothing;

  select id
  into personal_workspace_id
  from public.workspaces
  where owner_user_id = current_user_id;

  if personal_workspace_id is null then
    raise exception 'personal workspace bootstrap failed';
  end if;

  return personal_workspace_id;
end;
$$;

comment on function public.bootstrap_personal_workspace() is
  'Idempotently creates the authenticated user profile and single personal workspace.';
