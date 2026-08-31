# 2. Modèle de données

## Conventions

- PostgreSQL, UUID générés côté base, dates en `date`, instants en `timestamptz` UTC.
- Toutes les tables métier ont `id uuid PK`, `workspace_id uuid NOT NULL`, `created_at timestamptz`, `updated_at timestamptz` et, quand utile, `created_by uuid`.
- Suppression logique avec `archived_at timestamptz NULL` pour les objets métier; suppression physique réservée aux exports puis purges explicites.
- Montants en centimes (`integer`) et durées en minutes (`integer`) pour éviter les erreurs d’arrondi.
- Les listes fermées sont des enums PostgreSQL ou des contraintes `CHECK`; les catégories personnalisables restent du texte contrôlé.
- Toute FK métier doit référencer une ligne du même `workspace_id`; cette invariant est imposé par clés uniques composites ou triggers de contrainte.

## Identité et cloisonnement

### `profiles`

| Champ | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK, FK `auth.users(id)` cascade |
| `display_name` | `text` | NOT NULL, 1–120 caractères |
| `timezone` | `text` | NOT NULL, défaut `Europe/Paris` |
| `locale` | `text` | NOT NULL, défaut `fr-FR` |
| `created_at`, `updated_at` | `timestamptz` | NOT NULL |

### `workspaces`

`id`, `name text NOT NULL`, `owner_user_id uuid FK profiles`, `slug text`, `created_at`, `updated_at`; unique `(owner_user_id, slug)`. Un seul espace actif est prévu en MVP.

### `workspace_members`

`workspace_id FK workspaces`, `user_id FK profiles`, `role workspace_role` (`owner`, `editor`, `viewer`), `created_at`; PK `(workspace_id, user_id)`. Contrainte : exactement un propriétaire logique; le propriétaire du workspace doit avoir le rôle `owner`.

## Référentiels

### `organizations`

`id`, `workspace_id`, `name text NOT NULL`, `legal_name text`, `kind organization_kind` (`company`, `public_service`, `school`, `cfa`, `other`), `parent_organization_id uuid NULL FK organizations`, `website text`, `address jsonb`, `color char(7)`, `notes text`, timestamps, `archived_at`; unique partiel `(workspace_id, lower(name)) WHERE archived_at IS NULL`. Le parent reste dans le même workspace.

### `projects`

`id`, `workspace_id`, `organization_id uuid NULL FK organizations`, `name text NOT NULL`, `kind project_kind` (`apprenticeship`, `crous_role`, `study`, `personal`, `other`), `status lifecycle_status` (`planned`, `active`, `paused`, `completed`, `cancelled`), `starts_on date`, `ends_on date`, `weekly_target_minutes integer NULL CHECK >= 0`, `description text`, timestamps, `archived_at`; `ends_on >= starts_on`.

### `contacts`

`id`, `workspace_id`, `first_name text`, `last_name text`, `display_name text NOT NULL`, `primary_email citext NULL`, `primary_phone text NULL`, `category text`, `notes text`, timestamps, `archived_at`; au moins un nom affichable; email au format raisonnable si fourni. Pas d’unicité stricte sur l’e-mail pour éviter les collisions légitimes, mais détection de doublon à l’interface.

### `contact_organizations`

`workspace_id`, `contact_id FK contacts`, `organization_id FK organizations`, `job_title text`, `role_label text`, `is_primary boolean default false`, `starts_on date`, `ends_on date`; PK `(contact_id, organization_id)`, cohérence du workspace obligatoire.

## Activité et exécution

### `missions`

`id`, `workspace_id`, `organization_id FK organizations NOT NULL`, `project_id FK projects NULL`, `title text NOT NULL`, `description text`, `owner_contact_id FK contacts NULL`, `priority priority_level` (`low`, `normal`, `high`, `urgent`), `status mission_status` (`backlog`, `planned`, `in_progress`, `blocked`, `done`, `cancelled`), `starts_on date`, `due_on date`, `completed_at timestamptz`, `progress smallint CHECK 0..100`, `last_activity_at timestamptz`, timestamps, `archived_at`; date de fin après début; `done` implique `completed_at` et `progress=100`.

### `tasks`

`id`, `workspace_id`, `organization_id FK organizations NULL`, `project_id FK projects NULL`, `mission_id FK missions NULL`, `parent_task_id FK tasks NULL`, `title text NOT NULL`, `description text`, `status task_status` (`todo`, `in_progress`, `waiting`, `done`, `cancelled`), `priority priority_level`, `due_at timestamptz NULL`, `completed_at timestamptz NULL`, `assigned_contact_id FK contacts NULL`, timestamps, `archived_at`; profondeur de sous-tâche limitée à 1 en MVP; `done` implique `completed_at`; parent du même workspace et différent de soi.

### `work_logs`

`id`, `workspace_id`, `organization_id FK organizations NOT NULL`, `project_id FK projects NOT NULL`, `mission_id FK missions NULL`, `event_id FK events NULL`, `work_date date NOT NULL`, `started_at timestamptz`, `ended_at timestamptz`, `duration_minutes integer NOT NULL CHECK 1..1440`, `activity_type text NOT NULL`, `comment text`, `location text`, `sensitive_person_ref text NULL`, timestamps; `ended_at > started_at`; si les deux instants sont présents, la durée doit correspondre à cinq minutes près. Index `(workspace_id, project_id, work_date)`.

### `notes`

`id`, `workspace_id`, `organization_id FK organizations NULL`, `project_id FK projects NULL`, `mission_id FK missions NULL`, `contact_id FK contacts NULL`, `kind note_kind` (`general`, `apprenticeship_journal`, `crous_intervention`, `meeting_report`), `title text NOT NULL`, `body text NOT NULL`, `occurred_on date`, `learned text`, `problems text`, `solutions text`, `decisions text`, `next_actions text`, `is_sensitive boolean default false`, timestamps, `archived_at`.

## Engagements et calendrier

### `contracts`

`id`, `workspace_id`, `organization_id FK organizations NOT NULL`, `project_id FK projects NULL`, `contract_type text NOT NULL`, `title text NOT NULL`, `status contract_status` (`draft`, `collecting`, `awaiting_signature`, `active`, `completed`, `cancelled`), `starts_on date`, `ends_on date`, `weekly_minutes integer CHECK >= 0`, `gross_hourly_cents integer CHECK >= 0`, `net_hourly_cents integer CHECK >= 0`, `salary_notes text`, `school_organization_id FK organizations NULL`, `cfa_organization_id FK organizations NULL`, `opco_organization_id FK organizations NULL`, timestamps, `archived_at`; dates cohérentes.

### `events`

`id`, `workspace_id`, `organization_id FK organizations NULL`, `project_id FK projects NULL`, `mission_id FK missions NULL`, `task_id FK tasks NULL`, `title text NOT NULL`, `category event_category` (`course`, `company`, `crous`, `meeting`, `deadline`, `personal`, `administrative`), `starts_at timestamptz NOT NULL`, `ends_at timestamptz NOT NULL`, `all_day boolean default false`, `location text`, `description text`, `status event_status` (`confirmed`, `tentative`, `cancelled`), `source source_kind` (`manual`, `google_calendar`), `external_id text NULL`, `external_updated_at timestamptz NULL`, timestamps, `archived_at`; `ends_at > starts_at`; unique partiel `(workspace_id, source, external_id)` si `external_id` non nul. Les conflits sont calculés par chevauchement, pas persistés.

## Documents et administration

### `documents`

`id`, `workspace_id`, `organization_id FK organizations NULL`, `project_id FK projects NULL`, `contract_id FK contracts NULL`, `name text NOT NULL`, `category text NOT NULL`, `status document_status` (`draft`, `to_sign`, `submitted`, `valid`, `expired`, `replaced`, `archived`), `version text`, `issued_on date`, `expires_on date`, `storage_bucket text NOT NULL`, `storage_path text NOT NULL`, `mime_type text NOT NULL`, `size_bytes bigint CHECK >= 0`, `sha256 char(64)`, `notes text`, timestamps, `archived_at`; unique `(workspace_id, storage_bucket, storage_path)`; bucket privé seulement; expiration après émission.

### `entity_documents`

Lien polymorphe contrôlé : `workspace_id`, `document_id FK documents`, `entity_type linked_entity_type` (`mission`, `task`, `contact`, `event`, `administrative_step`, `note`), `entity_id uuid`, `created_at`; unique `(document_id, entity_type, entity_id)`. Un trigger vérifie existence et workspace de la cible. Les liens directs fréquents restent dans `documents`.

### `administrative_pipelines`

`id`, `workspace_id`, `organization_id FK organizations NOT NULL`, `project_id FK projects NULL`, `contract_id FK contracts NULL`, `name text NOT NULL`, `status pipeline_status` (`not_started`, `in_progress`, `blocked`, `completed`, `cancelled`), `started_on date`, `completed_on date`, timestamps, `archived_at`.

### `administrative_steps`

`id`, `workspace_id`, `pipeline_id FK administrative_pipelines ON DELETE CASCADE`, `position smallint CHECK > 0`, `title text NOT NULL`, `status step_status` (`todo`, `in_progress`, `waiting_external`, `blocked`, `done`, `skipped`), `responsible_contact_id FK contacts NULL`, `due_on date`, `completed_at timestamptz`, `document_id FK documents NULL`, `comment text`, timestamps; unique `(pipeline_id, position)`; `done` implique `completed_at`.

## Communications et rappels

### `communications`

`id`, `workspace_id`, `organization_id FK organizations NULL`, `project_id FK projects NULL`, `channel communication_channel` (`email`, `phone`, `meeting`, `sms`, `whatsapp_manual`, `other`), `direction communication_direction` (`inbound`, `outbound`, `internal`), `subject text`, `summary text NOT NULL`, `occurred_at timestamptz NOT NULL`, `source source_kind` (`manual`, `gmail`), `external_id text NULL`, `external_url text NULL`, `needs_follow_up boolean default false`, `follow_up_on date`, timestamps, `archived_at`; unique partiel `(workspace_id, source, external_id)` si présent.

### `communication_contacts`

`workspace_id`, `communication_id FK communications ON DELETE CASCADE`, `contact_id FK contacts`, `role participant_role` (`from`, `to`, `cc`, `participant`); PK `(communication_id, contact_id, role)`.

### `reminders`

`id`, `workspace_id`, `title text NOT NULL`, `remind_at timestamptz NOT NULL`, `status reminder_status` (`scheduled`, `sent`, `dismissed`, `failed`), `channel reminder_channel` (`in_app`, `email`, `push`), `entity_type linked_entity_type`, `entity_id uuid`, `dedupe_key text`, `last_error text`, timestamps; unique partiel `(workspace_id, dedupe_key)` si fourni.

### `automation_rules`

Prévue au schéma mais hors interface MVP : `id`, `workspace_id`, `name`, `trigger_type automation_trigger`, `conditions jsonb`, `action_type automation_action`, `action_config jsonb`, `enabled boolean`, `requires_approval boolean default true`, `last_run_at`, timestamps. CHECK JSON objet. Les types autorisés sont versionnés et validés côté serveur.

## Traçabilité et intégrations

### `activity_logs`

`id bigserial PK`, `workspace_id`, `actor_user_id uuid NULL`, `action text NOT NULL`, `entity_type text NOT NULL`, `entity_id uuid`, `metadata jsonb default '{}'`, `occurred_at timestamptz NOT NULL`; append-only; aucun contenu complet de document, secret ou corps d’e-mail.

### `integration_accounts`

Hors MVP actif : `id`, `workspace_id`, `provider integration_provider` (`google`, `microsoft`, `meta`), `provider_account_id text`, `scopes text[]`, `status integration_status` (`connected`, `expired`, `revoked`, `error`), `token_secret_ref text`, `connected_at`, `last_synced_at`, timestamps; unique `(workspace_id, provider, provider_account_id)`. `token_secret_ref` pointe vers un coffre serveur; aucun token ou mot de passe n’est stocké en clair dans cette table.

### `export_jobs`

`id`, `workspace_id`, `requested_by`, `format export_format` (`json`, `csv_zip`, `pdf_summary`), `status job_status` (`queued`, `running`, `ready`, `failed`, `expired`), `storage_path text NULL`, `expires_at timestamptz`, `error_code text`, timestamps. Les exports sont privés, temporaires et journalisés.

## Relations principales

```text
auth.users ── profiles ── workspace_members ── workspaces
                                             ├── organizations ── projects
                                             ├── contacts ── contact_organizations ── organizations
                                             ├── missions ── tasks
                                             ├── contracts ── administrative_pipelines ── administrative_steps
                                             ├── documents ── entity_documents
                                             ├── events
                                             ├── communications ── communication_contacts ── contacts
                                             ├── work_logs
                                             ├── notes
                                             ├── reminders
                                             └── activity_logs
```

## Indexes essentiels

- Chaque table métier : `(workspace_id, updated_at DESC)`.
- Objets filtrés : `(workspace_id, organization_id, status)`.
- Tâches : `(workspace_id, status, due_at)` avec filtre sur non archivées.
- Événements : GiST sur intervalle temporel ou index `(workspace_id, starts_at, ends_at)`.
- Documents : `(workspace_id, expires_on)` pour les expirations actives.
- Communications : `(workspace_id, occurred_at DESC)` et participants par `contact_id`.
- Recherche MVP : indexes trigram/texte sur noms, titres et résumés; pas de contenu binaire ni de données sensibles indexées.

## Données initiales proposées

Un assistant de démarrage peut proposer, après confirmation, deux organisations et deux projets : « Soufflet Malt / InVivo — Alternance 2026–2027 » et « CROUS Marthe Gautier — Étudiant référent 2026–2027 ». Les contacts nommés, salaires, contrats et documents ne sont jamais créés sans validation explicite de l’utilisateur.

