# T-0002 — Design System and Responsive Shell

Status: `APPROVED`

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

## Review corrections

- Mobile inactive navigation labels now use the shared `muted-foreground` token, which is designed for the light card background. Desktop navigation keeps the dedicated sidebar token and the active/inactive distinction remains visible.
- The skip link uses a deterministic focus-visible style based on existing foreground, background, and ring tokens. It is fully visible immediately when reached by keyboard and remains above the header and sidebar.
- Every protected main-content target keeps `id="main-content"` and is programmatically focusable with `tabIndex={-1}`. Activating the skip link with Enter moves `document.activeElement` to that target.
- Dedicated E2E coverage now verifies skip-link visibility, keyboard focus, URL fragment navigation, and actual main-content focus.
- A dedicated 360 × 800 mobile Axe audit covers inactive bottom-navigation entries, including color contrast.

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
- `npm run test:e2e`: 3 scenarios passed for desktop auth/navigation/logout, keyboard skip-link behavior, and the 360 × 800 mobile shell.
- Automated Axe scans: no critical or serious violation on the authenticated desktop dashboard or mobile tasks placeholder.
- Manual review: desktop sidebar, mobile navigation, focus visibility, skip link, login/logout, route protection, and common loading/error/empty implementations reviewed. The mobile viewport has no horizontal overflow.

## Final review

The two review findings are corrected and reproduced by automated tests. T-0001 authentication and RLS regression checks remain green. T-0002 is approved; no T-0003 business functionality was introduced.
