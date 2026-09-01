# T-0003 — Organizations & Projects Foundation

Status: `APPROVED`

## TITLE

T-0003 — Organizations & Projects Foundation

The execution scope of this ticket is limited to organizations. The historical title is retained for traceability, but the `projects` entity and every project interface are deferred.

## OBJECTIVE

Deliver the first complete business module for managing the organizational contexts of the authenticated user's personal workspace: list, create, inspect, edit, logically archive, and filter organizations without introducing real personal or professional data.

## CONTEXT

T-0001 already provides a minimal `organizations` table, workspace-scoped RLS policies for every CRUD operation, a read service, and a minimal dashboard list. T-0002 provides the approved responsive shell and shared loading, error, empty, focus, and accessibility patterns.

T-0003 must evolve this foundation rather than create a parallel organization model. The organization module remains generic: no table, route, or behavior may be specialized for Soufflet Malt, CROUS, a university, CFA, OPCO, or another real institution.

The historical functional reference is `HUB-005`, limited here to its organization portion. `T-XXXX` is the only official execution numbering system.

## DEPENDENCIES

- T-0001 — Bootstrap, Authentication and Personal Workspace Foundation: `APPROVED`.
- T-0002 — Design System and Responsive Shell: `APPROVED`.
- Existing Supabase migrations `202608310001` and `202608310002` remain the immutable baseline.
- Local Supabase and Playwright Chromium must be available for DB/RLS and E2E verification.

## PRECONDITIONS

- T-0002 corrections are committed or otherwise preserved as the reviewed baseline before implementation begins.
- The worktree is reviewed so T-0003 changes can be distinguished from T-0002 changes.
- The local database can be recreated from versioned migrations.
- `.env.local` contains only local browser-safe Supabase values and remains ignored by Git.
- This plan receives explicit human approval and `IMPLEMENTATION_AUTHORIZED` is changed to `true` before any T-0003 code is written.

## SCOPE

- Active organization list scoped to the current workspace.
- Archived organization list through an explicit `active` / `archived` filter.
- Organization creation.
- Organization detail page.
- Organization modification.
- Logical archive through `archived_at`; no destructive UI action.
- Minimal organization type set:
  - `employer`
  - `crous`
  - `university`
  - `cfa`
  - `opco`
  - `administration`
  - `other`
- Minimal database evolution, indexes, validation, and complete RLS regression coverage.
- Responsive desktop/mobile interfaces using the approved T-0002 shell.
- Consistent loading, error, and empty states.
- Keyboard navigation, visible focus, accessible labels, and automated accessibility checks.
- Unit, database constraint, RLS, integration, and E2E tests.

## OUT_OF_SCOPE

- Projects table, project CRUD, project routes, or project filters.
- Organization parent/child hierarchy, memberships, teams, invitations, or roles.
- Real organization records or automatic creation of Soufflet Malt, CROUS, university, CFA, OPCO, or administrative organizations.
- Contacts, missions, tasks, documents, contracts, calendar, work logs, search, dashboard read models, reminders, communications, or journal behavior.
- Gmail, WhatsApp, Google Calendar, n8n, AI, OCR, external synchronization, and notifications.
- Physical deletion from the product interface.
- Bulk import/export, custom organization types, logos, file uploads, addresses, websites, colors, notes, or organization-specific widgets.
- Advanced RBAC, collaboration, audit event sourcing, or multi-workspace switching.

## FILES_ALLOWED

- `supabase/migrations/202608310003_organizations_foundation.sql`
- `src/modules/organizations/**`
- `src/app/(hub)/organizations/**`
- `src/app/(hub)/page.tsx` only if the existing minimal organization summary must remain compatible with the evolved schema.
- `src/components/ui/**` only for a directly required reusable primitive that does not introduce unrelated design-system work.
- `tests/unit/organization*.test.ts`
- `tests/integration/organization*.test.ts` and/or equivalent Node test files.
- `tests/rls/organization*.test.ts` and/or equivalent Node test files.
- `tests/e2e/organization*.spec.ts`
- `docs/tickets/T-0003-ORGANIZATIONS-PROJECTS-FOUNDATION.md`
- `docs/project/PROJECT-STATE.md`
- `README.md` only for verified setup, route, or ticket-status documentation.

## FILES_FORBIDDEN

- Existing migrations `202608310001_identity_workspace.sql` and `202608310002_identity_workspace_rls.sql`.
- `supabase/seed.sql` for any real or named organization data.
- Auth, session, proxy, or workspace foundation code unless a proven T-0003 blocker requires a separately reviewed change.
- Routes and modules for projects, contacts, missions, tasks, documents, contracts, calendar, administration workflows, work logs, search, integrations, automation, or AI.
- `.env*` files other than documentation-only examples, credentials, local Supabase state, generated artifacts, and personal documents.
- Broad shell redesign or unrelated refactoring.

## DATA_MODEL

Evolve the existing `public.organizations` table with the smallest sufficient model:

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Existing primary key |
| `workspace_id` | `uuid` | Existing non-null FK to `workspaces`, cascade on workspace deletion |
| `name` | `text` | Non-null, trimmed application input, 1–160 characters |
| `type` | `text` | Non-null, constrained to the seven approved values |
| `archived_at` | `timestamptz` | Nullable; non-null means logically archived |
| `created_at` | `timestamptz` | Existing non-null timestamp |
| `updated_at` | `timestamptz` | Existing non-null timestamp maintained by trigger |

Migration behavior:

- Add `archived_at` without modifying historical migrations.
- Replace the old type constraint with the approved type set.
- Migrate existing generic development values deterministically: `company → employer`, `school → university`, `public_service → administration`; keep `cfa` and `other`. Do not infer `crous` or `opco` from names.
- Replace the existing workspace/name unique index with a partial case-insensitive unique index for active rows only: `(workspace_id, lower(name)) WHERE archived_at IS NULL`.
- Add an index supporting workspace plus archive-state list queries.
- Preserve current ownership-based RLS for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. T-0003 exposes no physical delete action, but must not weaken or bypass the T-0001 policy matrix.
- Never accept `workspace_id` from a browser form as an authorization decision; derive the active workspace on the server.

Application validation:

- Separate Zod schemas for persisted organization data, creation input, update input, and filter values.
- Trim names and reject blank or overlong values.
- Reject unknown type values.
- Treat IDs as UUIDs and archive timestamps as nullable ISO-compatible timestamps.

## EXPECTED_IMPLEMENTATION

1. Add one forward-only migration that evolves the existing organization table and indexes safely.
2. Update organization schemas and types to match the migrated database contract.
3. Implement server-side organization operations that always derive and enforce the active workspace:
   - list by `active` or `archived` state;
   - fetch one organization by ID within the active workspace;
   - create;
   - update name/type;
   - archive by setting `archived_at`.
4. Validate every mutation with Zod and return user-safe validation/conflict errors without leaking database internals.
5. Revalidate affected routes after successful mutations and use server redirects only after persistence succeeds.
6. Replace the `/organizations` placeholder with the responsive organization list and filter.
7. Add explicit creation, detail, and editing routes using the existing protected `(hub)` layout.
8. Show an archived organization as archived on its detail page and prevent misleading active-state actions.
9. Provide deterministic loading, error, empty-active, and empty-archived states using T-0002 patterns.
10. Keep the existing dashboard summary read-only and compatible; do not turn it into a T-0005 dashboard.
11. Do not add project code despite the retained ticket title.

## TESTS

### Unit

- Accept every approved organization type and reject legacy/unknown values.
- Trim and validate organization names, including empty and 160/161-character boundaries.
- Validate active/archived filter values.
- Validate persisted rows with nullable `archived_at`.

### Database constraints and migration

- Apply all migrations to an empty local database.
- Verify deterministic migration of every legacy type.
- Reject unsupported type values.
- Reject blank/overlong names at the appropriate boundary.
- Enforce case-insensitive name uniqueness among active organizations in one workspace.
- Allow reusing an archived organization's name according to the approved partial-index rule.
- Allow the same active name in different workspaces.
- Verify `updated_at` changes on update.

### RLS and integration

- Anonymous clients cannot read or mutate organizations.
- User A can select, insert, update, archive, and delete only rows in Workspace A.
- User B receives the symmetrical permissions for Workspace B.
- Cross-workspace `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are denied in both directions.
- A guessed organization UUID never reveals another workspace's row.
- Browser-provided or tampered `workspace_id` cannot create or move a row across workspaces.
- Active and archived filters never escape the current workspace.
- Duplicate active-name conflicts produce a safe application result.
- T-0001 auth, bootstrap idempotency, route protection, and RLS tests remain green.

### UI and E2E

- Unauthenticated access to every organization route redirects to `/login`.
- Authenticated user sees the active empty state initially.
- Create a generic organization, then verify it appears in the active list.
- Open its detail page in under the expected navigation path.
- Edit name/type and verify persisted values.
- Archive it, verify it leaves the active list and appears under the archived filter.
- Verify no physical-delete control is exposed.
- Verify validation and duplicate-name feedback.
- Run the critical journey on desktop and at 360 × 800.
- Verify keyboard navigation, focus visibility, labels, landmarks, and no critical/serious Axe violations.
- Verify loading, error, active-empty, and archived-empty states.

### Standard verification

- `npm run typecheck`
- `npm run lint`
- `npm test`
- clean local database reset
- `npm run test:db`
- targeted organization integration/RLS tests
- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- final scope and secret scan

## ACCEPTANCE_CRITERIA

- An authenticated user can list, create, inspect, edit, and logically archive an organization in their own workspace.
- Active/archived filters are explicit, deterministic, URL-preserving where appropriate, and responsive.
- Organization types are limited to the seven approved values.
- No real organization is committed or seeded.
- All organization reads and writes are scoped by the authenticated user's active workspace on the server and protected by RLS in the database.
- Cross-workspace CRUD attempts fail under user credentials without `service_role`.
- Archived records remain retrievable through the archived filter and no physical-delete UI exists.
- Empty, loading, error, validation, and conflict states are clear and do not expose technical details.
- Desktop and 360 px mobile journeys are keyboard accessible and have no critical/serious automated accessibility violations.
- T-0001 and T-0002 regression suites pass.
- No project or adjacent business-module implementation appears in the diff.

## SECURITY

- RLS remains the database authorization boundary; application filters are defense in depth only.
- Server operations derive `workspace_id` from the authenticated session and active workspace.
- Every ID lookup combines organization ID and active workspace, returning a not-found result without disclosing foreign-row existence.
- No `service_role`, secret key, privileged client, or arbitrary SQL is introduced.
- Mutation payloads are allowlisted and parsed with Zod; `workspace_id`, timestamps, and ownership fields are not mass-assignable.
- Database error details, policy names, SQL, and stack traces are not shown to users.
- Archive is an explicit named action; no destructive deletion is exposed.
- No real employer, CROUS, university, CFA, OPCO, contact, email, phone, address, document, or contract data enters Git, seeds, fixtures, screenshots, or logs.
- Security review must confirm that the existing RLS policies remain complete after the schema evolution.

## RISKS

- Legacy type migration can misclassify `public_service`; mitigation: map conservatively to `administration` and never infer from organization names.
- Partial uniqueness semantics may surprise users after archive; mitigation: document that active names are unique and test archived-name reuse explicitly.
- Server actions may accidentally trust form-supplied workspace IDs; mitigation: omit ownership fields from input schemas and derive workspace server-side.
- Archived rows may leak into active summaries; mitigation: centralize archive filters and test dashboard compatibility.
- Error handling may reveal cross-workspace existence; mitigation: use identical not-found behavior for absent and unauthorized IDs.
- T-0003 could expand into projects or organization-specific widgets; mitigation: enforce the allowed-file list and final diff audit.
- Uncommitted T-0002 changes could blur review boundaries; mitigation: preserve or commit the approved T-0002 baseline before implementation.

## ROLLBACK

- Before deployment, validate the forward migration against a disposable local database and record the previous constraint/index definitions.
- Application rollback consists of reverting T-0003 routes, services, schemas, and UI while retaining compatible additive columns.
- Database rollback for development may use a full local reset from the prior commit.
- Production rollback must use a reviewed forward migration that restores the previous type constraint/index only after confirming no rows use new type values or archived-name reuse.
- Never drop organization rows or overwrite `workspace_id` during rollback.
- If the migration or RLS verification fails, stop release and restore the last approved T-0002 application state.

## DOCUMENTATION

- Keep this ticket as the canonical T-0003 execution contract and update its status only through review.
- Update `docs/project/PROJECT-STATE.md` when implementation is explicitly authorized, enters review, or is approved.
- Document the final schema/type migration, archive semantics, routes, verification evidence, and any accepted trade-off.
- Update README setup or route documentation only when the implemented behavior requires it.
- Keep `docs/conception/04-backlog-mvp.md` as historical functional reference; do not create or assign status to new `HUB-XXX` tickets.
- Do not place credentials, real organizations, or personal data in documentation.

## DONE_WHEN

- Explicit human approval authorizes implementation.
- The forward migration is reproducible from an empty database and preserves T-0001 security guarantees.
- Organization list/create/detail/edit/archive/filter behavior meets every acceptance criterion on desktop and mobile.
- Unit, constraint, RLS, integration, E2E, accessibility, typecheck, lint, and build checks all pass.
- Manual review confirms keyboard flow, focus, loading/error/empty states, archive behavior, and the 30-second organization retrieval goal.
- Final Git diff contains only approved T-0003 files and no adjacent module, secret, real data, or generated artifact.
- Documentation evidence is current and the ticket is marked `READY_FOR_REVIEW` before approval.
- T-0003 is not marked `APPROVED` until human review completes.

## IMPLEMENTATION_EVIDENCE

- The forward migration adds logical archival, migrates legacy type values deterministically, enforces the approved type set, and permits active-name reuse only after archival.
- Organization routes now cover list, active/archived filters, create, detail, edit, and logical archive without exposing a physical-delete action.
- Server actions derive the workspace from the authenticated session and allowlist all mutable fields.
- Local database reset and the complete unit, DB/RLS, lint, typecheck, build, and E2E suites pass.
- E2E evidence covers authentication regression, keyboard navigation, automated accessibility, the complete organization lifecycle, validation feedback, and 360 px rendering.
- The scope audit found no Contacts, Missions, Projects, Tasks, Documents, Calendar, CROUS work-log, integration, automation, or AI implementation in T-0003.

T-0003: APPROVED
