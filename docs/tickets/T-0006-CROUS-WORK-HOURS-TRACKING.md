# T-0006 — CROUS Work Hours Tracking

Status: `READY_FOR_APPROVAL`

## TITLE

T-0006 — CROUS Work Hours Tracking

Historical reference: `HUB-012 — Suivi des heures CROUS`. `T-XXXX` remains the official execution numbering.

## OBJECTIVE

Deliver a private, reliable work-hours module for recording CROUS interventions, comparing completed time with a configurable contractual objective, and presenting exact weekly and monthly totals, remaining time, overruns, adjustments, and overlap warnings.

## CONTEXT

T-0003 provides organizations and T-0005 provides missions. A CROUS hours period belongs to one mission whose organization has type `crous`. The local professional resource document confirms the need for contract, planning, weekly, and validation concepts, but contains real personal and contractual information. Only generic product rules may be derived from it; no name, identifier, address, schedule, contractual figure, or actual work record may enter Git.

HUB-012 historically depended on HUB-011 Calendar. The explicitly approved execution sequence places CROUS hours before Calendar. T-0006 therefore owns only its intervention overlap checks and period summaries. It does not create calendar views, events, synchronization, or task deadlines.

## DEPENDENCIES

- T-0001 through T-0005: `APPROVED`.
- One active CROUS organization and one active mission from the approved models.
- Existing protected shell, RLS conventions, forms, loading/error/empty patterns, and test infrastructure.
- Europe/Paris business-time semantics with UTC persistence.

## PRECONDITIONS

- Explicit human approval changes T-0006 to `IN_PROGRESS`.
- `docs/project/PROJECT-STATE.md` authorizes implementation before code changes.
- A clean database reset succeeds through T-0005.
- The professional resource and `audit-projet.md` remain local, untracked, and untouched.

## SCOPE

- Create, inspect, edit, and logically archive CROUS hour periods.
- Each period links to one active mission backed by an organization of type `crous`.
- Configurable label, inclusive period dates, and objective stored in integer minutes.
- Create, inspect, edit, and logically archive work interventions within a period.
- Intervention start and end stored as timezone-aware instants.
- Calculated duration in integer minutes.
- Optional credited-duration override, requiring a non-empty justification when different from calculated duration.
- Advisory overlap detection against other active interventions in the same workspace.
- Explicit confirmation to save an overlapping intervention.
- Exact realized, remaining, and overrun totals for the whole period.
- ISO week and calendar-month summaries using Europe/Paris local time.
- Filters by period, week, month, and archive state.
- Clear distinction between calculated and adjusted duration.
- Desktop and 360 px responsive behavior, keyboard access, visible focus, accessible tables/cards, and tests.
- Loading, error, empty, validation, overlap-warning, unauthorized/not-found, and archived states.

## OUT_OF_SCOPE

- Calendar day/week/month views, calendar events, task deadlines, Google Calendar, Outlook, CalDAV, reminders, or notifications.
- Payroll, salary, hourly rate, overtime compensation, payslips, expenses, invoices, taxes, or HR approval workflows.
- Contract/document storage, signatures, document extraction, or legal interpretation.
- Automatic import from badge readers, spreadsheets, email, Gmail, WhatsApp, n8n, APIs, or AI.
- Live timers, geolocation, attendance surveillance, break compliance, or device tracking.
- Collaboration, manager accounts, validation by third parties, comments, or advanced RBAC.
- Export/PDF/CSV in this ticket.
- Real CROUS schedules, objectives, contract dates, identities, locations, or work logs in source, seeds, fixtures, screenshots, or documentation.

## FILES_ALLOWED

- `supabase/migrations/202609010006_crous_work_hours.sql`
- `src/modules/crous-hours/**`
- `src/app/(hub)/crous-hours/**`
- `src/app/(hub)/administration/page.tsx` only to expose a link to the module.
- `src/components/ui/**` only for a directly required generic primitive.
- `tests/unit/crous-hours*.test.ts`
- `tests/integration/crous-hours*.node.test.mjs`
- `tests/rls/crous-hours*.node.test.mjs`
- `tests/e2e/crous-hours*.spec.ts`
- `docs/tickets/T-0006-CROUS-WORK-HOURS-TRACKING.md`
- `docs/project/PROJECT-STATE.md`
- Test configuration only for a proven T-0006 blocker.

## FILES_FORBIDDEN

- Existing migrations T-0001 through T-0005.
- Authentication, proxy, workspace, organization mutation, contact, mission, or task foundations.
- Calendar, document, contract, communication, integration, automation, AI, collaboration, or RBAC modules.
- `supabase/seed.sql` for real or named periods and interventions.
- `.env*`, credentials, generated artifacts, local Supabase state, resource documents, and personal files.
- Broad shell or design-system redesign.

## DATA_MODEL

### `crous_hour_periods`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Generated primary key |
| `workspace_id` | `uuid` | Non-null workspace boundary |
| `mission_id` | `uuid` | Non-null mission in the same workspace |
| `label` | `text` | Trimmed, 1–160 characters |
| `starts_on`, `ends_on` | `date` | Non-null; end not before start |
| `target_minutes` | `integer` | Non-negative, bounded integer |
| `created_at`, `updated_at` | `timestamptz` | Non-null; update trigger |
| `archived_at` | `timestamptz` | Nullable logical archive marker |

Only one active period with the same mission, dates, and label is allowed. Server validation confirms that the mission belongs to the active workspace and its organization type is `crous`. Historical periods remain readable if the mission or organization is later archived.

### `crous_work_logs`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | Generated primary key |
| `workspace_id` | `uuid` | Non-null workspace boundary |
| `period_id` | `uuid` | Non-null period in the same workspace |
| `starts_at`, `ends_at` | `timestamptz` | Non-null; end strictly after start |
| `calculated_minutes` | `integer` | Derived server/database value, strictly positive |
| `credited_minutes` | `integer` | Non-negative effective duration |
| `adjustment_reason` | `text` | Required only when credited differs from calculated; max 500 |
| `notes` | `text` | Nullable, max 2,000 |
| `created_at`, `updated_at` | `timestamptz` | Non-null; update trigger |
| `archived_at` | `timestamptz` | Nullable logical archive marker |

The database derives `calculated_minutes` from instants and verifies adjustment consistency. An intervention must fall within its period when interpreted in Europe/Paris. Overlap is advisory rather than a database exclusion constraint; the server returns matching candidates and requires an explicit second confirmation.

Both tables enable RLS with workspace-owner `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies. Composite foreign keys prevent cross-workspace period/log relationships.

## EXPECTED_IMPLEMENTATION

1. Add one forward migration with tables, constraints, indexes, duration trigger, update triggers, grants, and complete RLS.
2. Add Zod schemas for persisted rows, period/log forms, filters, duration adjustment, and overlap confirmation.
3. Derive the active workspace in every server operation; never trust a submitted workspace or calculated duration.
4. Validate that new periods target an active mission whose organization type is `crous`.
5. Replace no existing business module; expose `/crous-hours` from the Administration page.
6. Provide period list/create/detail/edit/archive and intervention create/edit/archive flows.
7. Calculate ISO-week and month keys in Europe/Paris from persisted UTC instants.
8. Aggregate effective credited minutes with integer arithmetic only.
9. Present overlap candidates before saving and require explicit confirmation without hard blocking.
10. Return indistinguishable not-found behavior for absent and unauthorized identifiers.

## TESTS

- Typecheck, ESLint, unit tests, clean DB reset, DB/RLS tests, Next.js build, and E2E.
- Unit: raw duration, credited duration, remaining/overrun, minute formatting, ISO week, month keys, DST spring/fall transitions, and overlap boundaries.
- DB: date ranges, end-after-start, derived duration, adjustment justification, bounds, cross-workspace references, and archive semantics.
- RLS: anonymous denial and two-user isolation for every CRUD operation on both tables.
- Integration: period and log CRUD/archive, CROUS mission validation, overlap advisory/confirmation, exact period/week/month aggregations, and adjustments.
- Edge cases: interval ending exactly when another starts, partial/full overlaps, week spanning month/year, leap date, and Europe/Paris DST changes.
- E2E: empty state, period lifecycle, intervention lifecycle, overlap confirmation, adjusted duration, summaries, filters, and archives.
- Desktop and 360 px layout, keyboard-only navigation, visible focus, and no critical/serious automated accessibility violations.
- Regression: authentication/logout, protected routes, shell, Organizations, Contacts, Missions, Tasks, database policies, and production build.
- `git diff --check`, scope, secrets, generated-artifact, and personal-data scans.

## ACCEPTANCE_CRITERIA

- Only the workspace owner can read or mutate their periods and interventions.
- Calculated minutes come from persisted instants and cannot be forged by the client.
- Any credited-duration difference requires an explicit justification.
- Period, ISO-week, and calendar-month totals are exact integer-minute sums in Europe/Paris semantics.
- Remaining time never hides overruns; remaining and overrun are displayed separately.
- Exact-boundary intervals do not overlap; partial and contained intervals are warned.
- A warned overlap can be saved only after explicit confirmation.
- Archived rows leave active results while remaining available through archived filters.
- No Calendar, payroll, export, collaboration, external integration, or real data is introduced.

## SECURITY

- RLS remains the authorization boundary; filters are defense in depth.
- Server operations derive `workspace_id` from the authenticated session.
- Mission, period, and log identifiers are validated and scoped to the active workspace.
- Composite foreign keys reject cross-workspace relationships.
- Duration is recalculated at the database boundary; all client-supplied values are untrusted.
- No service-role client, secret, external API, or privileged mutation is introduced.
- User-visible errors reveal no SQL, policy, stack, foreign-row existence, or contract details.
- Notes and justifications are length-limited and rendered with React escaping.

## RISKS

- DST and timezone errors: persist instants in UTC and centralize Europe/Paris grouping logic with transition tests.
- Rounding drift: store and aggregate integer minutes only; define truncation/rejection behavior for non-minute instants.
- Incorrect contractual totals: keep target configurable and separate calculated, credited, remaining, and overrun values.
- Hidden overlaps: use strict interval logic and deterministic candidate ordering.
- Scope drift into payroll or Calendar: prohibit rates, compensation, events, reminders, and third-party validation.
- Sensitive records: use minimal fields, synthetic tests, and no copied resource values.

## ROLLBACK

- Validate the additive migration on a disposable local database before review.
- Application rollback removes the CROUS-hours entry point while leaving additive tables dormant.
- Development may reset to the last approved T-0005 migration.
- Production rollback requires a reviewed forward migration and never deletes hour records automatically.
- Any RLS, duration, timezone, aggregation, or cross-workspace failure blocks release.

## DOCUMENTATION

- Keep this file as the canonical T-0006 contract and record status transitions here.
- Update `docs/project/PROJECT-STATE.md` at authorization, review, and approval.
- Document final timezone, ISO-week, duration, adjustment, overlap, remaining, and overrun semantics.
- Keep HUB-012 as historical traceability only; never create another HUB execution ticket.
- Never quote or copy the local professional resource or record its real values.

## DONE_WHEN

- Explicit human approval authorizes implementation.
- Clean migration and complete RLS matrix pass.
- Period/log CRUD, duration, adjustment, overlap, aggregation, archive, responsive, and accessibility criteria pass.
- T-0001 through T-0005 regressions remain green.
- The final diff contains no Calendar implementation, payroll, exports, integrations, secrets, real data, or generated artifacts.
- Documentation is current and T-0006 is `READY_FOR_REVIEW`.
- T-0006 is not `APPROVED` before explicit human review.

T-0006: READY_FOR_APPROVAL
