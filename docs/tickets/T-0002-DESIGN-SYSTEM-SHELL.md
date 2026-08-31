# T-0002 — Design System and Responsive Shell

Status: `READY_FOR_REVIEW`

## Objective

Provide the shared, accessible application frame required by later business modules without implementing their data or workflows.

## Implemented scope

- Shared visual tokens for application, feedback, and sidebar colors.
- Protected desktop shell with grouped navigation, account context, logout, and skip link.
- Mobile header and five-destination bottom navigation usable at 360 px.
- Active-route indication through `aria-current="page"`.
- Explicit placeholder routes for future modules; no CRUD or business data was added.
- Reusable empty state plus route-level loading and error states.
- Visible focus treatment and reduced-motion handling.
- Disabled search affordance clearly announced as unavailable; no premature search feature.

## Out of scope preserved

- Organization and project CRUD.
- Missions, tasks, contacts, documents, calendar, contracts, administration, and journal behavior.
- External integrations, automation, and AI.
- Real Soufflet Malt, CROUS, school, contact, contract, or document data.

## Verification evidence

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 2 files, 4 tests passed.
- `npm run test:db`: 3 tests passed, including cross-workspace CRUD isolation.
- `npm run build`: pass, 15 application routes generated.
- `npm run test:e2e`: pass at desktop and 360 × 800 mobile viewport.
- Automated Axe scan: no critical or serious violation on the authenticated dashboard.

## Manual review requested

Confirm the desktop information density, mobile bottom-navigation labels, and overall visual direction before changing the status to `APPROVED` or starting T-0003.

