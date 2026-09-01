# T-0005 — Missions, Tasks & Subtasks

Status: `READY_FOR_APPROVAL`

## TITLE

T-0005 — Missions, Tasks & Subtasks

Historical reference: `HUB-007 — Missions, tâches et sous-tâches`. `T-XXXX` remains the official execution numbering.

## OBJECTIVE

Deliver a private workspace module for organizing professional missions and their actionable tasks through accessible list and simple Kanban views, with clear priorities, dates, one-level subtasks, filters, and reliable overdue and completion rules.

## CONTEXT

T-0003 provides workspace-owned organizations and T-0004 provides contacts and organization context. The protected shell currently exposes placeholder `/missions` and `/tasks` routes. T-0005 replaces only those placeholders.

The private professional resource document informs future product needs but contains real personal and contractual data. T-0005 must use only generic domain concepts and synthetic examples. CROUS work logs, contractual hours, payroll calculations, and academic-year reporting remain deferred to the later HUB-012 successor ticket.

## DEPENDENCIES

- T-0001 through T-0004: `APPROVED`.
- Existing authenticated personal workspace and complete RLS conventions.
- Active organizations from T-0003; contacts remain optional contextual references only if explicitly included after review.
- Existing responsive shell, form, loading/error/empty, and test infrastructure.

## PRECONDITIONS

- Explicit human approval changes T-0005 to `IN_PROGRESS`.
- `docs/project/PROJECT-STATE.md` authorizes implementation before code changes.
- The local database resets successfully through migration T-0004.
- Existing approved functionality and user-owned untracked files remain untouched.

## SCOPE

- Mission list, creation, detail, modification, logical archive, and active/archived filters.
- Mission linkage to one active organization in the current workspace.
- Mission status: `draft`, `active`, `on_hold`, or `completed`.
- Optional mission description, start date, target end date, and actual completion date.
- Task list, creation, detail/edit, completion, cancellation, and logical archive.
- Task status: `todo`, `in_progress`, `blocked`, `done`, or `cancelled`.
- Task priority: `low`, `medium`, `high`, or `urgent`.
- Optional start and due dates; overdue state calculated from due date and open status.
- Tasks belong to one mission.
- One subtask level through an optional parent task in the same mission and workspace.
- Mission-scoped task list and simple accessible Kanban grouped by task status.
- Global Tasks page with organization, mission, status, priority, due-state, and archived filters.
- Deterministic ordering and explicit empty, loading, validation, conflict, error, and not-found states.
- Desktop and 360 px responsive behavior, keyboard navigation, visible focus, accessibility, and tests.

## OUT_OF_SCOPE

- CROUS hours, work logs, schedules, timesheets, monthly totals, overtime, payroll, rates, or academic-year calculations.
- Contacts expansion, communications timeline changes, assignments to people, collaboration, teams, comments, mentions, or advanced RBAC.
- Projects as a separate model, portfolios, OKRs, recurring tasks, task templates, dependencies, Gantt, calendar synchronization, reminders, notifications, or automations.
- Drag-and-drop Kanban; status changes must remain keyboard-accessible through explicit controls.
- Documents, contracts, search, Gmail, WhatsApp, n8n, AI, imports, exports, or external APIs.
- Physical deletion from the interface.
- Real professional, personal, contractual, employer, university, or CROUS data in Git.

## FILES_ALLOWED

- `supabase/migrations/202609010005_missions_tasks_subtasks.sql`
- `src/modules/missions/**`
- `src/modules/tasks/**`
- `src/app/(hub)/missions/**`
- `src/app/(hub)/tasks/**`
- `src/app/(hub)/organizations/[id]/page.tsx` only for read-only mission navigation if required.
- `src/components/ui/**` only for a directly required generic primitive.
- `tests/unit/mission*.test.ts`
- `tests/unit/task*.test.ts`
- `tests/integration/mission*.node.test.mjs`
- `tests/integration/task*.node.test.mjs`
- `tests/rls/mission*.node.test.mjs`
- `tests/rls/task*.node.test.mjs`
- `tests/e2e/mission*.spec.ts`
- `tests/e2e/task*.spec.ts`
- `docs/tickets/T-0005-MISSIONS-TASKS-SUBTASKS.md`
- `docs/project/PROJECT-STATE.md`
- Test configuration only for a proven T-0005 blocker.

## FILES_FORBIDDEN

- Existing migrations T-0001 through T-0004.
- Authentication, proxy, workspace, organization mutation, or contact foundations.
- CROUS/time-log, calendar, document, contract, communication, integration, automation, AI, collaboration, or RBAC modules.
- `supabase/seed.sql` for named organizations, missions, people, schedules, or work records.
- `.env*`, credentials, generated artifacts, local Supabase state, resource documents, and personal files.
- Broad shell or design-system redesign.

## DATA_MODEL

### `missions`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Generated primary key |
| `workspace_id` | `uuid` | Non-null FK to workspace |
| `organization_id` | `uuid` | Non-null active organization in the same workspace at creation |
| `title` | `text` | Trimmed, 1–180 characters |
| `description` | `text` | Nullable, max 4,000 |
| `status` | `text` | `draft`, `active`, `on_hold`, `completed` |
| `starts_on` | `date` | Nullable |
| `target_ends_on` | `date` | Nullable; not before start |
| `completed_at` | `timestamptz` | Required only for completed status |
| `created_at`, `updated_at` | `timestamptz` | Non-null; update trigger |
| `archived_at` | `timestamptz` | Nullable logical archive marker |

Mission completion is rejected while it has any non-archived task outside `done` or `cancelled`. Organization archival never deletes or hides historical missions.

### `tasks`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Generated primary key |
| `workspace_id` | `uuid` | Non-null workspace boundary |
| `mission_id` | `uuid` | Non-null mission in the same workspace |
| `parent_task_id` | `uuid` | Nullable task in the same mission and workspace |
| `title` | `text` | Trimmed, 1–240 characters |
| `description` | `text` | Nullable, max 4,000 |
| `status` | `text` | `todo`, `in_progress`, `blocked`, `done`, `cancelled` |
| `priority` | `text` | `low`, `medium`, `high`, `urgent` |
| `starts_on`, `due_on` | `date` | Nullable; due date not before start |
| `completed_at` | `timestamptz` | Present only for `done` |
| `position` | `integer` | Non-negative deterministic ordering value |
| `created_at`, `updated_at` | `timestamptz` | Non-null; update trigger |
| `archived_at` | `timestamptz` | Nullable logical archive marker |

A parent task cannot itself have a parent. Cycles, cross-mission parents, and cross-workspace links are rejected. A parent may be completed only when every active child is `done` or `cancelled`. Overdue is derived at query/render time when `due_on` is before the current local date and status is open; it is not persisted.

Both tables enable RLS with owner-scoped `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies. Composite constraints and validation preserve workspace consistency across organizations, missions, parents, and children.

## EXPECTED_IMPLEMENTATION

1. Add one forward migration with enums/checks, composite keys, indexes, triggers, grants, integrity rules, and complete RLS.
2. Add separate persisted, create, update, filter, transition, and hierarchy Zod schemas.
3. Derive the active workspace in every server operation and never trust a submitted workspace ID.
4. Replace only `/missions` and `/tasks` placeholders with protected list/create/detail/edit/archive flows.
5. Offer active organizations for new missions while retaining archived organization labels on historical records.
6. Implement task status changes with explicit accessible controls in list and Kanban views.
7. Enforce one-level subtasks and completion coherence both server-side and at the database boundary where practical.
8. Calculate overdue state consistently without scheduled jobs or stored drift.
9. Preserve filters in URLs and provide deterministic pagination/order if result size requires it.
10. Return indistinguishable not-found behavior for absent and unauthorized identifiers.

## TESTS

- Typecheck, ESLint, unit tests, clean DB reset, DB/RLS tests, Next.js build, and E2E.
- Unit: schema trimming, statuses, priorities, date ordering, open/done classification, and overdue calculation.
- DB: workspace-consistent mission/organization links, date constraints, completion timestamps, parent depth, parent cycles, same-mission hierarchy, and archive semantics.
- RLS: anonymous denial and two-user isolation for every CRUD operation on missions and tasks.
- Integration: mission CRUD/archive, task CRUD/transitions/archive, filters, list/Kanban grouping, subtasks, parent completion, and mission completion coherence.
- E2E: empty states, mission lifecycle, task and subtask lifecycle, accessible status changes, filters, overdue display, archive views, and not-found behavior.
- Desktop and 360 px layout, keyboard-only navigation, visible focus, and no critical/serious automated accessibility violations.
- Regression: authentication/logout, protected routes, shell navigation, Organizations, Contacts, database policies, and production build.
- `git diff --check`, scope, secrets, generated-artifact, and personal-data scans.

## ACCEPTANCE_CRITERIA

- A user can manage only missions and tasks belonging to their personal workspace.
- Missions retain their organization context and expose coherent active/completed/archive states.
- Tasks expose reliable status, priority, start/due dates, and calculated overdue state.
- One-level subtasks cannot form cycles or cross mission/workspace boundaries.
- A parent task or mission cannot be completed while active required work remains open.
- List and simple Kanban views remain fully usable by keyboard and at 360 px.
- Filters produce stable URL-addressable results.
- No CROUS work-log, time tracking, collaboration, external integration, or real data is introduced.

## SECURITY

- RLS is the authorization boundary; UI filtering is defense in depth.
- Server operations derive `workspace_id` from the authenticated session.
- Referenced organization, mission, and parent identifiers are validated within the active workspace.
- Database constraints reject cross-workspace and invalid hierarchy relationships.
- No service-role client, secret, external API, or privileged mutation is introduced.
- User-visible errors reveal no SQL, policy, stack, or foreign-row existence.
- Text fields are trimmed and length-limited; all rendered content uses React escaping.

## RISKS

- Hierarchy complexity: enforce exactly one subtask level and reject cycles at multiple boundaries.
- Status drift: centralize transition and completion timestamp rules.
- Mission completion races: verify open tasks transactionally in the database.
- Timezone ambiguity for overdue dates: use date-only values and document local-date comparison.
- Kanban accessibility: use semantic headings/lists and explicit controls, with no required drag-and-drop.
- Scope drift toward CROUS hours or collaboration: exclude time records, assignees, comments, and notifications.

## ROLLBACK

- Validate the additive migration on a disposable local database before review.
- Application rollback restores mission/task placeholders while leaving additive tables dormant.
- Development may reset to the last approved T-0004 migration.
- Production rollback requires a reviewed forward migration and never deletes mission/task data automatically.
- Any RLS, hierarchy, or completion-integrity failure blocks release.

## DOCUMENTATION

- Keep this file as the canonical T-0005 contract and record status transitions here.
- Update `docs/project/PROJECT-STATE.md` at authorization, review, and approval.
- Record the final schema, transition matrix, hierarchy rules, overdue semantics, and verification evidence.
- Keep HUB-007 as historical traceability only; never create another HUB execution ticket.
- Never copy the professional resource document or real organization, mission, schedule, or work-log data.

## DONE_WHEN

- Explicit human approval authorizes implementation.
- Clean migration and complete mission/task RLS tests pass.
- Mission, task, subtask, filters, list/Kanban, overdue, completion, archive, responsive, and accessibility criteria pass.
- T-0001 through T-0004 regressions remain green.
- The final diff contains no CROUS hours, time tracking, collaboration, integrations, secrets, real data, or generated artifacts.
- Documentation is current and T-0005 is `READY_FOR_REVIEW`.
- T-0005 is not `APPROVED` before explicit human review.

T-0005: READY_FOR_APPROVAL
