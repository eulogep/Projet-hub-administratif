create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid,
  project_id uuid,
  mission_id uuid,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 180),
  category text not null check (category in ('identity', 'administrative', 'contract', 'education', 'work', 'other')),
  status text not null default 'draft' check (status in ('draft', 'to_sign', 'submitted', 'valid', 'expired', 'archived')),
  issued_on date,
  expires_on date,
  notes text check (notes is null or char_length(notes) <= 2000),
  current_version_number integer check (current_version_number is null or current_version_number > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_id_workspace_unique unique (id, workspace_id),
  foreign key (organization_id, workspace_id) references public.organizations(id, workspace_id),
  foreign key (project_id, workspace_id) references public.projects(id, workspace_id),
  foreign key (mission_id, workspace_id) references public.missions(id, workspace_id),
  check (expires_on is null or issued_on is null or expires_on >= issued_on)
);

create table public.document_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null,
  provider text not null default 'cloudflare_r2' check (provider = 'cloudflare_r2'),
  upload_id text,
  storage_bucket text not null check (char_length(storage_bucket) between 1 and 255),
  storage_key text not null check (char_length(storage_key) between 1 and 1024),
  original_file_name text not null check (char_length(original_file_name) between 1 and 255),
  expected_size bigint not null check (expected_size > 0),
  expected_mime text not null check (expected_mime in ('application/pdf', 'image/png', 'image/jpeg')),
  state text not null default 'initiated' check (state in ('initiated', 'uploading', 'completing', 'verifying', 'completed', 'failed', 'aborted', 'expired')),
  expires_at timestamptz not null,
  completed_version_id uuid,
  last_error_code text check (last_error_code is null or char_length(last_error_code) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_upload_sessions_id_workspace_unique unique (id, workspace_id),
  constraint document_upload_sessions_storage_unique unique (storage_bucket, storage_key),
  foreign key (document_id, workspace_id) references public.documents(id, workspace_id) on delete cascade,
  check (storage_key ~ ('^' || workspace_id::text || '/' || document_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](pdf|png|jpg)$')),
  check ((expected_mime = 'application/pdf' and storage_key like '%.pdf') or (expected_mime = 'image/png' and storage_key like '%.png') or (expected_mime = 'image/jpeg' and storage_key like '%.jpg'))
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null,
  upload_session_id uuid not null,
  version_number integer not null check (version_number > 0),
  storage_provider text not null check (storage_provider = 'cloudflare_r2'),
  storage_bucket text not null check (char_length(storage_bucket) between 1 and 255),
  storage_key text not null check (char_length(storage_key) between 1 and 1024),
  original_file_name text not null check (char_length(original_file_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  size_bytes bigint not null check (size_bytes > 0),
  sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  etag text,
  created_at timestamptz not null default now(),
  constraint document_versions_id_workspace_unique unique (id, workspace_id),
  constraint document_versions_document_number_unique unique (document_id, version_number),
  constraint document_versions_storage_unique unique (workspace_id, storage_bucket, storage_key),
  constraint document_versions_upload_session_unique unique (upload_session_id),
  foreign key (document_id, workspace_id) references public.documents(id, workspace_id) on delete cascade,
  foreign key (upload_session_id, workspace_id) references public.document_upload_sessions(id, workspace_id)
);

alter table public.document_upload_sessions
  add constraint document_upload_sessions_completed_version_fk
  foreign key (completed_version_id, workspace_id)
  references public.document_versions(id, workspace_id);

create index documents_workspace_filters_idx
  on public.documents (workspace_id, archived_at, organization_id, project_id, category, status, expires_on, name);
create index document_versions_document_order_idx
  on public.document_versions (workspace_id, document_id, version_number desc);
create index document_upload_sessions_cleanup_idx
  on public.document_upload_sessions (state, expires_at)
  where state not in ('completed', 'aborted', 'expired');

create function public.validate_document_context()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  linked_organization_id uuid;
  linked_project_id uuid;
begin
  if new.project_id is not null then
    select organization_id into linked_organization_id
    from public.projects
    where id = new.project_id and workspace_id = new.workspace_id;
    if not found then
      raise exception 'Invalid document project' using errcode = '23503';
    end if;
    if new.organization_id is not null and new.organization_id <> linked_organization_id then
      raise exception 'Document project organization mismatch' using errcode = '23514';
    end if;
  end if;

  if new.mission_id is not null then
    select organization_id, project_id into linked_organization_id, linked_project_id
    from public.missions
    where id = new.mission_id and workspace_id = new.workspace_id;
    if not found then
      raise exception 'Invalid document mission' using errcode = '23503';
    end if;
    if new.organization_id is not null and new.organization_id <> linked_organization_id then
      raise exception 'Document mission organization mismatch' using errcode = '23514';
    end if;
    if new.project_id is not null and new.project_id is distinct from linked_project_id then
      raise exception 'Document mission project mismatch' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger documents_validate_context
before insert or update of workspace_id, organization_id, project_id, mission_id on public.documents
for each row execute function public.validate_document_context();
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create function public.validate_document_current_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.current_version_number is not null and not exists (
    select 1 from public.document_versions
    where workspace_id = new.workspace_id
      and document_id = new.id
      and version_number = new.current_version_number
  ) then
    raise exception 'Invalid current document version' using errcode = '23503';
  end if;
  return new;
end;
$$;

create constraint trigger documents_validate_current_version
after insert or update of current_version_number on public.documents
deferrable initially deferred
for each row execute function public.validate_document_current_version();
create trigger document_upload_sessions_set_updated_at
before update on public.document_upload_sessions
for each row execute function public.set_updated_at();

create function public.reject_document_version_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Document versions are immutable' using errcode = '55000';
end;
$$;

create trigger document_versions_immutable
before update or delete on public.document_versions
for each row execute function public.reject_document_version_mutation();

create function public.finalize_document_upload(
  p_session_id uuid,
  p_actual_size bigint,
  p_sha256 text,
  p_etag text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  upload_session public.document_upload_sessions%rowtype;
  next_version integer;
  new_version_id uuid;
begin
  select sessions.* into upload_session
  from public.document_upload_sessions sessions
  join public.workspaces workspaces on workspaces.id = sessions.workspace_id
  where sessions.id = p_session_id
    and workspaces.owner_user_id = (select auth.uid())
  for update of sessions;

  if not found then
    raise exception 'Upload session not found' using errcode = 'P0002';
  end if;
  if upload_session.state = 'completed' and upload_session.completed_version_id is not null then
    return upload_session.completed_version_id;
  end if;
  if upload_session.state <> 'verifying' then
    raise exception 'Upload session is not ready for finalization' using errcode = '55000';
  end if;
  if p_actual_size <> upload_session.expected_size then
    raise exception 'Uploaded object size mismatch' using errcode = '23514';
  end if;
  if p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid SHA-256' using errcode = '22023';
  end if;

  perform 1 from public.documents
  where id = upload_session.document_id and workspace_id = upload_session.workspace_id
  for update;

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.document_versions
  where document_id = upload_session.document_id;

  insert into public.document_versions (
    workspace_id, document_id, upload_session_id, version_number,
    storage_provider, storage_bucket, storage_key, original_file_name,
    mime_type, size_bytes, sha256, etag
  ) values (
    upload_session.workspace_id, upload_session.document_id, upload_session.id, next_version,
    upload_session.provider, upload_session.storage_bucket, upload_session.storage_key,
    upload_session.original_file_name, upload_session.expected_mime,
    p_actual_size, p_sha256, p_etag
  ) returning id into new_version_id;

  update public.documents
  set current_version_number = next_version
  where id = upload_session.document_id and workspace_id = upload_session.workspace_id;

  update public.document_upload_sessions
  set state = 'completed', completed_version_id = new_version_id, last_error_code = null
  where id = upload_session.id;

  return new_version_id;
end;
$$;

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_upload_sessions enable row level security;

revoke all on table public.documents, public.document_versions, public.document_upload_sessions from anon;
revoke all on table public.documents, public.document_versions, public.document_upload_sessions from authenticated;
grant select, insert, update on table public.documents to authenticated;
grant select on table public.document_versions to authenticated;
grant select, insert, update on table public.document_upload_sessions to authenticated;

create policy documents_select_own_workspace on public.documents for select to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = documents.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy documents_insert_own_workspace on public.documents for insert to authenticated
with check (exists (select 1 from public.workspaces where workspaces.id = documents.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy documents_update_own_workspace on public.documents for update to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = documents.workspace_id and workspaces.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.workspaces where workspaces.id = documents.workspace_id and workspaces.owner_user_id = (select auth.uid())));

create policy document_versions_select_own_workspace on public.document_versions for select to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = document_versions.workspace_id and workspaces.owner_user_id = (select auth.uid())));

create policy document_upload_sessions_select_own_workspace on public.document_upload_sessions for select to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = document_upload_sessions.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy document_upload_sessions_insert_own_workspace on public.document_upload_sessions for insert to authenticated
with check (exists (select 1 from public.workspaces where workspaces.id = document_upload_sessions.workspace_id and workspaces.owner_user_id = (select auth.uid())));
create policy document_upload_sessions_update_own_workspace on public.document_upload_sessions for update to authenticated
using (exists (select 1 from public.workspaces where workspaces.id = document_upload_sessions.workspace_id and workspaces.owner_user_id = (select auth.uid())))
with check (exists (select 1 from public.workspaces where workspaces.id = document_upload_sessions.workspace_id and workspaces.owner_user_id = (select auth.uid())));

revoke all on function public.finalize_document_upload(uuid, bigint, text, text) from public, anon;
grant execute on function public.finalize_document_upload(uuid, bigint, text, text) to authenticated;
