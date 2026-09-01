# T-0004 — Contacts & Personal CRM

Status: `APPROVED`

## TITLE

T-0004 — Contacts & Personal CRM

Historical reference: `HUB-006 — Contacts et rattachements`. `T-XXXX` remains the official execution numbering.

## OBJECTIVE

Deliver a private personal CRM for listing, finding, creating, inspecting, editing, and logically archiving contacts, linking them to one or more organizations, and keeping a minimal manual interaction timeline with a visible follow-up.

## CONTEXT

T-0003 provides the approved organization model, active/archived behavior, workspace-scoped Server Actions, and complete RLS. The existing `/contacts` page is only a shell placeholder.

Contacts must be useful before Missions and Tasks exist. A lightweight manual follow-up can therefore be attached to an interaction; task-derived next actions remain deferred. No real identity or professional information may be committed.

## DEPENDENCIES

- T-0001, T-0002, and T-0003: `APPROVED`.
- Local Supabase and non-privileged test clients.
- Existing protected shell, organization module, loading/error patterns, and E2E setup.

## PRECONDITIONS

- Explicit human approval changes this ticket to `IN_PROGRESS`.
- `IMPLEMENTATION_AUTHORIZED` becomes `true` before any Contacts code is written.
- The database resets successfully through the T-0003 migration.
- Existing approved changes and `audit-projet.md` remain untouched.

## SCOPE

- Active and archived contact lists.
- Create, detail, edit, and logical archive flows.
- Search by name or email, tolerant of case and accents.
- First name, last name, display name, optional email, phone, category, and short notes.
- Many-to-many contact–organization links.
- Per-link job title, contextual role, and primary-organization marker.
- Minimal manual interaction timeline: type, date/time, summary, optional organization.
- Optional interaction follow-up label/date and completion.
- Earliest incomplete follow-up visible on the contact detail page.
- Advisory duplicate detection by normalized email or strongly similar name; explicit confirmation remains possible.
- Loading, error, empty, validation, conflict, and not-found states.
- Desktop and 360 px responsive behavior, keyboard access, visible focus, accessibility, and tests.

## OUT_OF_SCOPE

- Missions, Tasks, Projects, Kanban, Calendar, Documents, Contracts, CROUS hours, Journal, dashboard aggregation, or global search.
- Sending or importing email/messages; Gmail, Outlook, WhatsApp APIs, Google Contacts, webhooks, n8n, or AI.
- Attachments, avatars, addresses, social profiles, enrichment, bulk import/export, vCard, marketing, collaboration, or advanced RBAC.
- Physical deletion from the interface.
- Task-derived next actions until the Missions/Tasks ticket.
- Real contacts, emails, phone numbers, or interaction content in Git.

## FILES_ALLOWED

- `supabase/migrations/202609010004_contacts_personal_crm.sql`
- `src/modules/contacts/**`
- `src/app/(hub)/contacts/**`
- `src/app/(hub)/organizations/[id]/page.tsx` only for a read-only Contacts link if necessary.
- `src/components/ui/**` only for a directly required generic primitive.
- `tests/unit/contact*.test.ts`
- `tests/integration/contact*.node.test.mjs`
- `tests/rls/contact*.node.test.mjs`
- `tests/e2e/contact*.spec.ts`
- `docs/tickets/T-0004-CONTACTS-PERSONAL-CRM.md`
- `docs/project/PROJECT-STATE.md`
- Test configuration only for a proven T-0004 blocker.

## FILES_FORBIDDEN

- Existing migrations `202608310001_*`, `202608310002_*`, and `202608310003_*`.
- Authentication, proxy, workspace, or organization mutation foundations.
- Routes/modules for Missions, Tasks, Projects, Documents, Contracts, Calendar, CROUS logs, integrations, automation, or AI.
- `supabase/seed.sql` for named or real contacts.
- `.env*`, credentials, generated artifacts, local Supabase state, and personal documents.
- Broad shell or design-system redesign.

## DATA_MODEL

### `contacts`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Generated primary key |
| `workspace_id` | `uuid` | Non-null FK to `workspaces`, cascade on workspace deletion |
| `first_name`, `last_name` | `text` | Nullable, trimmed, max 120 each |
| `display_name` | `text` | Non-null, trimmed, 1–180 characters |
| `primary_email` | `text` | Nullable, lowercase normalized, reasonable format |
| `primary_phone` | `text` | Nullable, trimmed, max 40 |
| `category` | `text` | Nullable, trimmed, max 80 |
| `notes` | `text` | Nullable, max 4,000 |
| `created_at`, `updated_at` | `timestamptz` | Non-null; update trigger |
| `archived_at` | `timestamptz` | Nullable logical archive marker |

Email is intentionally not unique. Indexes support workspace/archive/name ordering, normalized email lookup, and accent-tolerant name search.

### `contact_organizations`

| Column | Type | Constraints |
| --- | --- | --- |
| `workspace_id` | `uuid` | Non-null workspace boundary |
| `contact_id` | `uuid` | FK to contacts, cascade on contact deletion |
| `organization_id` | `uuid` | FK to organizations |
| `job_title`, `role_label` | `text` | Nullable, trimmed, max 160 |
| `is_primary` | `boolean` | Non-null, default false |
| `created_at` | `timestamptz` | Non-null |

Primary key: `(contact_id, organization_id)`. Contact and organization must share `workspace_id`; at most one primary organization is allowed per contact.

### `contact_interactions`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Generated primary key |
| `workspace_id` | `uuid` | Non-null workspace boundary |
| `contact_id` | `uuid` | Non-null FK to contacts, cascade on contact deletion |
| `organization_id` | `uuid` | Nullable FK to organizations |
| `kind` | `text` | `email`, `phone`, `meeting`, `message`, or `other` |
| `summary` | `text` | Non-null, trimmed, 1–2,000 characters |
| `occurred_at` | `timestamptz` | Non-null |
| `follow_up_label` | `text` | Nullable, max 240 |
| `follow_up_on` | `date` | Nullable; requires a label |
| `follow_up_completed_at` | `timestamptz` | Nullable |
| `created_at`, `updated_at` | `timestamptz` | Non-null; update trigger |

This is contact-owned manual history only, not an external Communications integration.

All tables enable RLS for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Policies use workspace ownership, while constraints/triggers ensure every linked contact and organization belongs to the same workspace.

## EXPECTED_IMPLEMENTATION

1. Add one forward migration with tables, constraints, indexes, triggers, grants, and full RLS.
2. Add separate persisted, create, update, filter, link, interaction, and follow-up Zod schemas.
3. Derive the active workspace in every server operation; never trust a form-supplied workspace ID.
4. Replace the Contacts placeholder with list/search/filter/create/detail/edit/archive routes.
5. Offer only active organizations visible in the current workspace when editing links.
6. Display organization roles on contact list/detail pages.
7. Present duplicate candidates before saving and require explicit confirmation without hard blocking.
8. Render interactions newest-first and expose the earliest open follow-up.
9. Allow follow-up completion without creating Tasks.
10. Return the same not-found behavior for absent and unauthorized IDs.

## TESTS

- Typecheck, ESLint, unit tests, DB/RLS tests, build, and E2E.
- Unit: display-name derivation, trimming, email normalization, filters, interaction and follow-up validation.
- DB: lengths, blank names, one primary organization, same-workspace relationships, follow-up consistency, archive semantics.
- RLS: anonymous denial and two-user isolation for contacts, links, and interactions across all CRUD operations.
- Integration: CRUD/archive, multi-organization links, primary-link replacement, accent/case search, duplicate advisory, timeline ordering, follow-up calculation/completion.
- E2E: empty list, create with organizations, detail/edit, duplicate confirmation, interaction, follow-up, archive/filter.
- 360 px layout, keyboard/focus, and no critical/serious automated accessibility violations.
- Regression for authentication, protected routes, shell, organizations, database, and build.
- `git diff --check`, scope, secrets, generated-artifact, and personal-data scans.

## ACCEPTANCE_CRITERIA

- The authenticated user can manage contacts only within their workspace.
- A contact can link to zero, one, or multiple active organizations with contextual roles and one optional primary organization.
- Search matches case/accent variants and normalized email.
- Duplicate candidates are visible but a confirmed save remains possible.
- Interactions are ordered deterministically and the earliest incomplete follow-up is visible/completable.
- Archived contacts leave active results and appear under the archived filter.
- No physical delete, external sending/import, or adjacent business module is exposed.
- Loading/error/empty/validation states are accessible and responsive at 360 px.
- No real personal or professional data is committed.

## SECURITY

- RLS remains the authorization boundary; UI filters are defense in depth.
- Server operations derive `workspace_id` from the authenticated session.
- UUIDs and referenced rows are validated and scoped to the active workspace.
- Database constraints reject cross-workspace contact/organization/interaction relationships.
- No service-role client, secret, external API, or privileged mutation is introduced.
- User-visible errors expose no SQL, policy, stack, or foreign-row existence.
- Notes and summaries are length-limited and accompanied by minimal-data guidance.

## RISKS

- Duplicate detection false positives: keep it advisory and require explicit confirmation.
- Accent-tolerant search portability: use a reviewed deterministic normalization strategy and test a clean migration.
- Cross-workspace leakage through join rows: enforce at DB level and cover with direct RLS tests.
- Timeline drift into Communications: restrict it to manual contact-owned history with no send/import behavior.
- Follow-up overlap with future Tasks: keep it interaction-owned and plan a non-destructive future bridge.
- Sensitive notes: use minimal fields, limits, warning copy, and synthetic tests only.

## ROLLBACK

- Validate the migration on a disposable local database before review.
- Application rollback removes the Contacts module while leaving additive tables dormant.
- Development may reset to the last approved migration.
- Production rollback requires a reviewed forward migration and must never erase contact data automatically.
- Any RLS or relationship-integrity failure stops release and restores the T-0003 application state.

## DOCUMENTATION

- Keep this file as the canonical T-0004 contract and update its status through every transition.
- Update `docs/project/PROJECT-STATE.md` at authorization, review, and approval.
- Record final schema, search normalization, duplicate semantics, timeline/follow-up behavior, and verification evidence.
- Keep HUB-006 as historical traceability only; never create a new HUB execution ticket.
- Never document real contacts, coordinates, organizations, or interactions.

## IMPLEMENTATION_EVIDENCE

- Clean local database reset applied migrations T-0001 through T-0004 successfully.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test`: 3 files and 9 unit tests passed.
- `npm run test:db`: 8 authentication, integration, and RLS tests passed.
- `npm run build`: pass; 17 application routes generated, including the protected Contacts routes.
- `npm run test:e2e`: 7 scenarios passed against the production build, covering authentication/logout, protected workspace regression, keyboard focus, 360 px navigation, accessibility, Organizations, Contacts, duplicate confirmation, timeline, follow-up, and archive.
- `git diff --check`: pass.
- Scope review found no Missions, Tasks, CROUS work-log, external messaging, automation, AI, collaboration, or advanced RBAC implementation in T-0004.
- All committed test data is synthetic. The local professional resource document remains untracked and was not copied into source, migrations, fixtures, tests, or documentation.

## DONE_WHEN

- Explicit human approval authorizes implementation.
- The clean migration and complete contact-related RLS matrix pass.
- CRUD, search, duplicates, organization links, timeline, follow-up, archive, responsive, and accessibility criteria pass.
- T-0001 through T-0003 regressions remain green.
- The final diff contains no Missions, Tasks, CROUS hours, integrations, secrets, real data, or generated artifacts.
- Documentation is current and T-0004 is `READY_FOR_REVIEW`.
- T-0004 is not `APPROVED` before explicit human review.

T-0004: APPROVED
