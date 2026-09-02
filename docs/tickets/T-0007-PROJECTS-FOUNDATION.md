# T-0007 — Projects Foundation

Status: `APPROVED`

## TITLE

T-0007 — Projects Foundation

Historical reference: project portion deferred from `HUB-005 — Organisations et projets`. `T-XXXX` remains the only official execution numbering.

## OBJECTIVE

Deliver a private, workspace-scoped project module that lets the authenticated user list, create, inspect, edit, filter, and logically archive projects belonging to organizations, with an optional and backward-compatible link from missions to projects.

## CONTEXT

T-0003 deliberately implemented organizations only and explicitly deferred every project table, route, and interface. T-0004, T-0005, and T-0006 subsequently delivered contacts, missions/tasks, and CROUS work hours without requiring projects. T-0007 closes that known gap without redesigning those approved modules.

A project is an organizational context above zero or more missions. Existing missions remain valid with no project. A project must never become a second authorization boundary: the personal workspace and its RLS policies remain authoritative.

## DEPENDENCIES

- T-0001 through T-0006: `APPROVED`.
- T-0003 organization ownership, archive semantics, and complete RLS baseline.
- T-0005 mission model and protected mission flows.
- T-0002 responsive shell, accessibility, focus, loading, error, and empty-state patterns.
- Local Supabase and Playwright Chromium for database/RLS and E2E verification.

## PRECONDITIONS

- This plan receives explicit human approval before implementation.
- `docs/project/PROJECT-STATE.md` changes to `IMPLEMENT`, `IN_PROGRESS`, and `IMPLEMENTATION_AUTHORIZED: true` before code changes.
- A clean database reset succeeds through migration T-0006.
- The worktree is reviewed so T-0007 changes remain isolated.
- The local professional resource and `audit-projet.md` remain untracked, untouched, and absent from all fixtures.

## SCOPE

- Active and archived project lists.
- Project creation, detail, modification, and logical archive.
- Filters by archive state, organization, and project status.
- Project detail with its organization and linked missions.
- Optional project association on mission creation and modification.
- Existing missions without a project remain fully supported.
- Organization detail may expose read-only project navigation.
- Minimal database model, constraints, indexes, and complete RLS.
- Responsive desktop and 360 px mobile layouts.
- Keyboard navigation, visible focus, accessible names, and automated accessibility coverage.
- Loading, error, validation, and empty states.
- Unit, database/RLS, integration, regression, and E2E tests.

## OUT_OF_SCOPE

- Project membership, teams, invitations, collaboration, ownership transfer, or advanced RBAC.
- Budgets, billing, payroll, rates, invoices, costs, time billing, or financial reporting.
- Project templates, custom fields, tags, colors, logos, milestones, dependencies, roadmaps, Gantt, or portfolio views.
- Automatic mission creation, task duplication, cascading status changes, or cascading archive.
- Contacts, Documents, Contracts, Calendar, CROUS work-log behavior, Journal, Communications, Dashboard, Search, reminders, exports, or audit-log implementation.
- Gmail, WhatsApp, n8n, AI, OCR, webhooks, notifications, or external synchronization.
- Physical deletion from the product interface.
- Real organizations, projects, missions, people, dates, contract values, or professional records in Git.

## FILES_ALLOWED

- `supabase/migrations/202609020007_projects_foundation.sql`
- `src/modules/projects/**`
- `src/app/(hub)/projects/**`
- `src/config/navigation.ts` only to add the Projects destination.
- `src/app/(hub)/organizations/[id]/page.tsx` only for project navigation or a scoped project summary.
- `src/modules/missions/schemas/mission.schema.ts` only for the optional project identifier.
- `src/modules/missions/services/mission.service.ts` only for project selection/filtering and display.
- `src/modules/missions/actions/mission.actions.ts` only for secure optional project association.
- `src/modules/missions/components/mission-form.tsx` only for the optional project selector.
- `src/app/(hub)/missions/**` only where project selection, filtering, or display is required.
- `src/components/ui/**` only for a directly required reusable primitive.
- `tests/unit/project*.test.ts`
- `tests/integration/project*.test.*` and/or `tests/rls/project*.test.*`
- `tests/e2e/project*.spec.ts`
- Existing mission tests only where the optional relation requires regression coverage.
- `docs/tickets/T-0007-PROJECTS-FOUNDATION.md`
- `docs/project/PROJECT-STATE.md`
- `README.md` only for verified setup or route documentation.

## FILES_FORBIDDEN

- Migrations T-0001 through T-0006.
- Auth, session, proxy, workspace, contacts, tasks, CROUS-hours, storage, or integration internals unless a proven blocker receives separate human approval.
- Routes or modules for Documents, Contracts, Calendar, Journal, Communications, Dashboard, Search, reminders, exports, AI, or automation.
- `supabase/seed.sql` for named or real project data.
- `.env*`, credentials, Supabase local state, generated output, uploaded files, and personal documents.
- Broad shell redesign, unrelated refactoring, or dependency upgrades.

## DATA_MODEL

Create `public.projects` with the smallest sufficient model:

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Primary key, generated UUID |
| `workspace_id` | `uuid` | Non-null FK to `workspaces`, cascade on workspace deletion |
| `organization_id` | `uuid` | Non-null organization in the same workspace |
| `name` | `text` | Trimmed, 1–180 characters |
| `description` | `text` | Nullable, maximum 4000 characters |
| `status` | `text` | `planned`, `active`, `on_hold`, `completed`, or `cancelled` |
| `starts_on` | `date` | Nullable |
| `target_ends_on` | `date` | Nullable and not before `starts_on` |
| `completed_at` | `timestamptz` | Non-null exactly when status is `completed` |
| `archived_at` | `timestamptz` | Nullable logical archive marker |
| `created_at` | `timestamptz` | Non-null, database-generated |
| `updated_at` | `timestamptz` | Non-null, maintained by the existing timestamp trigger |

Database rules:

- Add composite uniqueness required for workspace-safe foreign keys.
- Enforce an organization foreign key on `(organization_id, workspace_id)`.
- Active project names are case-insensitively unique inside one organization; archived rows do not block reuse.
- Add indexes for workspace/archive/status/organization lists.
- Enable RLS and provide owner-scoped `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies for authenticated users.
- Anonymous access is denied by default.
- Add nullable `missions.project_id`.
- Enforce `(project_id, workspace_id, organization_id)` against the corresponding project so a mission cannot reference a project from another workspace or organization.
- Existing mission rows are not backfilled and remain valid with `project_id = null`.
- Archiving a project never archives, deletes, or detaches its missions. Historical project labels remain readable.

Application rules:

- Derive `workspace_id` from the authenticated session; never trust it from form data.
- New projects may select only active organizations.
- Existing projects tied to archived organizations remain readable and editable without silently moving them.
- A new or updated mission may select only an active project belonging to its selected organization.
- Changing a mission organization clears or rejects an incompatible project association explicitly.
- Project completion is independent from mission completion; no cascade or inferred status is introduced.

## EXPECTED_IMPLEMENTATION

1. Add one forward-only T-0007 migration; never edit prior migrations.
2. Add project Zod schemas, status labels, and date/status invariants.
3. Add workspace-scoped project query and mutation services.
4. Add server actions with allowlisted payloads and neutral user-facing errors.
5. Implement `/projects`, `/projects/new`, `/projects/[id]`, and `/projects/[id]/edit`.
6. Add an explicit active/archived filter plus organization and status filters.
7. Show linked missions on project detail without changing task or CROUS behavior.
8. Add Projects to the approved navigation structure without redesigning the shell.
9. Add optional project selection and display to the mission flow.
10. Add loading, error, validation, and empty states consistent with existing modules.
11. Preserve archived organizations/projects in historical displays.
12. Use synthetic generic fixtures only.

## TESTS

- Typecheck and ESLint.
- Unit tests for project schema, valid statuses, name/date bounds, and completion timestamp rules.
- Clean Supabase reset through T-0007.
- Database tests for uniqueness, date/status checks, composite organization/project relationships, and nullable legacy missions.
- RLS tests for anonymous denial and symmetric two-user isolation across every CRUD operation.
- Cross-workspace and cross-organization project-to-mission tampering tests.
- Integration tests for create/read/update/archive/filter and neutral not-found behavior.
- Mission regressions with and without a project.
- T-0001 through T-0006 regression suites.
- Next.js production build.
- E2E: create organization, create project, inspect, edit, filter, attach mission, detach mission, archive project, and retain historical mission display.
- Desktop navigation and mobile navigation at 360 px.
- Keyboard-only navigation, visible focus, semantic labels, and automated accessibility scan.
- Loading, error, validation, and empty-state coverage.
- Final Git diff and forbidden-scope audit.

## ACCEPTANCE_CRITERIA

- An authenticated user can manage projects only in their personal workspace.
- A project always belongs to exactly one organization in the same workspace.
- Active and archived projects are clearly separated and filterable.
- Project name uniqueness is case-insensitive within its active organization context.
- Date and completed-status invariants are enforced at application and database boundaries.
- A mission can optionally reference one project from the same organization and workspace.
- Existing missions without a project continue to work unchanged.
- Cross-workspace and cross-organization relationship tampering is rejected.
- Project archive is logical and does not mutate organizations, missions, tasks, or work logs.
- Historical links remain readable after organization or project archive.
- Routes remain protected and return neutral not-found/error behavior.
- The complete flow works at 360 px and by keyboard with visible focus.
- Loading, error, validation, and empty states are present and accessible.
- No real professional data or adjacent roadmap feature enters Git.

## SECURITY

- RLS is the authorization boundary; application filters are defense in depth.
- Every read and mutation is scoped to the active workspace.
- Composite foreign keys enforce workspace and organization consistency.
- Mutation payloads are parsed with Zod and exclude ownership, timestamps, and generated fields.
- No service-role client, privileged browser secret, external API, or storage bucket is introduced.
- Errors do not disclose SQL, policy names, row existence in another workspace, or private content.
- User-entered text is length-limited and rendered through React escaping.
- Physical `DELETE` is not exposed in the UI even though its RLS policy is tested.

## RISKS

- Scope expansion into portfolio management: keep the model and four routes minimal.
- Breaking approved missions: use a nullable relation and preserve the no-project path.
- Cross-organization inconsistency: enforce the three-column mission/project foreign key and server validation.
- Archive ambiguity: retain historical links and prohibit cascading archive behavior.
- Status drift: keep project status independent from missions and avoid automation.
- Real-data leakage: use generic synthetic names and keep local resources untracked.

## ROLLBACK

- Validate the additive migration on a disposable local database before review.
- Application rollback removes project routes/navigation and optional mission controls while leaving additive schema dormant.
- Existing missions remain valid because `project_id` is nullable.
- Production rollback uses a reviewed forward migration; it never deletes project or mission records automatically.
- Any RLS, cross-workspace, cross-organization, migration, or regression failure blocks release.

## DOCUMENTATION

- Keep this file as the canonical T-0007 execution contract.
- Update `docs/project/PROJECT-STATE.md` at authorization, review, and approval.
- Record the nullable mission/project relationship and archive semantics.
- Keep `HUB-005` as historical traceability only; never create a new HUB execution ticket.
- Never quote the local professional resource or copy its real values.

## IMPLEMENTATION_EVIDENCE

- A clean Supabase reset applied migrations T-0001 through T-0007 successfully.
- TypeScript typecheck and ESLint pass.
- Unit tests pass: 7 files, 21 tests.
- Database and RLS tests pass: 16 tests.
- The Next.js production build passes and includes the four protected project routes.
- End-to-end regression passes: 10 tests covering authentication, organizations, contacts, missions/tasks, CROUS hours, and projects.
- The project E2E covers creation, mission association, historical display, modification, logical archive, 360 px layout, and automated accessibility.
- Git diff whitespace validation passes.
- A targeted scope audit confirms no Documents, Contracts, Calendar, payroll, billing, external integration, service-role client, secret, or real professional data was introduced.
- The local professional resource and `audit-projet.md` remain untracked and were not added to Git.

## DONE_WHEN

- Human approval explicitly authorizes implementation.
- The clean migration and complete RLS matrix pass.
- Project CRUD, filters, archive, mission association, responsive, and accessibility criteria pass.
- T-0001 through T-0006 regressions remain green.
- The final diff contains no forbidden module, integration, secret, real data, or generated artifact.
- Documentation is current and T-0007 reaches `APPROVED`.
- T-0007 is not marked `APPROVED` before explicit human review.

T-0007: APPROVED
